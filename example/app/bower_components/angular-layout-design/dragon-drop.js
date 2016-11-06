'use strict';
var dragAble = false;

angular.module('design.drag-drop', ['colorpicker.module']).
  directive('designDragdrop', function ($document) {
    return {
      restrict: 'E',
      templateUrl: "./bower_components/angular-layout-design/template.html",
      scope: {
        diagram: "=",
        mode: "@",
        tableSelected: "&"
      },
      controller: function ($scope, $rootScope) {

      },
      link: function (scope, element, attrs) {
        var sTable = null, pTable = null, startX, startY, initialMouseX, initialMouseY;
        var s_z_key = 0;
        var s_t_key = 0;

        scope.tableClicked = function (table) {
          if(typeof scope.tableSelected === 'function') {
            scope.tableSelected({'table': table});
          }
        }

        scope.zoneSel = function($event){
          if (scope.mode == "selection") return;

          var zone_key = angular.element($event.target).attr("zone-key");
          if( zone_key == undefined ) return;

          angular.element($event.target).resizable();
          angular.element($event.target).resizable("destroy");

          var max_w = 0;
          var max_h = 0;

          angular.forEach(scope.diagram.zones[zone_key].tables, function(table){
            if( (table.location.x + table.size.width) > max_w )
            {
              max_w = table.location.x + table.size.width + 10;
            }

            if( (table.location.y + table.size.height) > max_h )
            {
              max_h = table.location.y + table.size.height + 10;
            }
          });

          angular.element($event.target).resizable({
            //                aspectRatio: true,
            start: function (event, ui) {
            },
            resize: function (event, ui) {
              if( max_w > ui.size.width )
              {
                ui.size.width   = max_w+5;                
                angular.element($event.target).resizable().trigger('mouseup');
              }
              if( max_h > ui.size.height )
              {
                ui.size.height  = max_h+5;
                angular.element($event.target).resizable().trigger('mouseup');
              }

              scope.diagram.zones[zone_key].size.width = parseInt(ui.size.width);
              scope.diagram.zones[zone_key].size.height = parseInt(ui.size.height);
            },
            stop: function (event, ui) {
            }
          });

        }

        scope.mdZoneClose = function ($event) {
          scope.diagram.zones.splice(angular.element($event.target).attr("z-key"), 1);
          if( angular.element($event.target).attr("z-key") == s_z_key )
          {
            pTable = null;
            s_z_key = 0;
            s_t_key = 0;
          }
        }

        scope.mdTable = function ($event) {
          if (scope.mode == "selection") return;
          sTable = angular.element($event.target);
          if( angular.element($event.target)[0].localName != "span")
          {
            sTable = angular.element($event.target).parent();           
          }

          if (scope.diagram.zones[s_z_key].tables[s_t_key]._isSelected != undefined) {
            scope.diagram.zones[s_z_key].tables[s_t_key]._isSelected = false;
          }
          s_z_key = sTable.attr("z-key");
          s_t_key = sTable.attr("t-key");

          scope.diagram.zones[s_z_key].tables[s_t_key]._isSelected = true;

          dragAble = true;

          startX = sTable.prop('offsetLeft');
          startY = sTable.prop('offsetTop');

          if (pTable != undefined) {
            pTable.resizable();
            pTable.resizable("destroy");
          }

          sTable.resizable();
          sTable.resizable("destroy");

          sTable.resizable({
            //                aspectRatio: true,
            start: function (event, ui) {
              dragAble = false;
            },
            resize: function (event, ui) {
              scope.diagram.zones[s_z_key].tables[s_t_key].size.width = parseInt(ui.size.width);
              scope.diagram.zones[s_z_key].tables[s_t_key].size.height = parseInt(ui.size.height);

              if (scope.diagram.zones[s_z_key].size.width < (ui.size.width + scope.diagram.zones[s_z_key].tables[s_t_key].location.x) || scope.diagram.zones[s_z_key].size.height < (ui.size.height + scope.diagram.zones[s_z_key].tables[s_t_key].location.y)) {
                event.stopPropagation();
                event.preventDefault();
                sTable.resizable().trigger('mouseup');
              }
            },
            stop: function (event, ui) {
              dragAble = false;
            }
          });


          pTable = sTable;

          initialMouseX = $event.clientX;
          initialMouseY = $event.clientY;
          return false;
        }

        scope.mdClose = function ($event) {
          scope.diagram.zones[angular.element($event.target).attr("z-key")].tables.splice(angular.element($event.target).attr("t-key"), 1);
          pTable = null;
          s_z_key = 0;
          s_t_key = 0;
        }

        scope.mmTable = function ($event) {
          var dx = startX + $event.clientX - initialMouseX;
          var dy = startY + $event.clientY - initialMouseY;

          if (dragAble && s_z_key != undefined && s_t_key != undefined 
            && dx >= 0 && dx <= (scope.diagram.zones[s_z_key].size.width - scope.diagram.zones[s_z_key].tables[s_t_key].size.width)
            && dy >= 0 && dy <= (scope.diagram.zones[s_z_key].size.height - scope.diagram.zones[s_z_key].tables[s_t_key].size.height)
          ) {

            scope.diagram.zones[s_z_key].tables[s_t_key].location.x = parseInt(dx);
            scope.diagram.zones[s_z_key].tables[s_t_key].location.y = parseInt(dy);
          }

        }

        scope.zoneAdd = function () {
          scope.diagram.zones.push(
            {
              id: 0,
              type: "square",
              name: "add Area",
              size: {
                width: 300,
                height: 600
              },
              tables: []
            }
          );
        }


        scope.muTable = function ($event) {
          dragAble = false;
        }

        scope.mlTable = function ($event) {
          dragAble = false;
        }

        scope.mdaTable = function ($event) {
          if (scope.mode == "design") {
            angular.element(element[0].querySelector('.table-area')).find('.s-z-t').bind('dragstart', handleDragStart);
            angular.element(element[0].querySelector('.table-area')).find('.s-z-t').bind('dragend', handleDragEnd);
            angular.element(element[0].querySelector('.zone-area')).find('.zone').bind('drop', handleDrop);
            angular.element(element[0].querySelector('.zone-area')).find('.zone').bind('dragover', handleDragOver);
          }
        }

        //clone drag and drop
        function handleDragStart(e) {
          this.style.opacity = '0.4';
          e.originalEvent.dataTransfer.effectAllowed = 'move';
          e.originalEvent.dataTransfer.dropEffect = 'move';
          var transferData = {
            zkey: angular.element(this).attr("t-type"),
            width: parseInt(angular.element(this).width()),
            height: parseInt(angular.element(this).height())
          };

          e.originalEvent.dataTransfer.setData('transData', JSON.stringify(transferData));
        }

        function handleDragEnd(e) {
          this.style.opacity = '1.0';
          angular.element(element[0].querySelector('.table-area')).find('.s-z-t').unbind('dragstart', handleDragStart);
          angular.element(element[0].querySelector('.table-area')).find('.s-z-t').unbind('dragend', handleDragEnd);
          angular.element(element[0].querySelector('.zone-area')).find('.zone').unbind('drop', handleDrop);
          angular.element(element[0].querySelector('.zone-area')).find('.zone').unbind('dragover', handleDragOver);
        }

        function handleDrop(e) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          var transData = JSON.parse(e.originalEvent.dataTransfer.getData('transData'));

          var zoneKey = angular.element(this).attr('zone-key');

          var dx = e.originalEvent.clientX - angular.element(this).offset().left + $document.scrollLeft() - transData.width / 2;
          var dy = e.originalEvent.clientY - angular.element(this).offset().top + $document.scrollTop() - transData.height / 2;

          scope.$apply(function () {
            scope.diagram.zones[zoneKey].tables.push(
              {
                id: scope.diagram.zones[zoneKey].tables.length + 1,
                type: transData.zkey,
                text: "drag table",
                seatingCapacity: 8,
                readableLocation: "string",
                status: "",
                size: {
                  width: transData.width,
                  height: transData.height
                },
                location: {
                  x: dx,
                  y: dy
                  // Or location in some other format is okay
                },
                additionalInfo: {},
                _isSelected: false
              }
            );
          });
        }

        function handleDragOver(e) {
          e.originalEvent.preventDefault();
          e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
          return false;
        }

      }
    };
  });
