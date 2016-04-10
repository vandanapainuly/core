/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpActionHistoryCtrl', ['$scope', '$modal', 'workzoneServices', function($scope, $modal , workzoneServices) {
			var cpInstance = $scope.$parent.cpInstance;
			$scope.instInfo = cpInstance;
			var cpActCtrl={
				gridOptions:{}
			};
			cpActCtrl.gridSettings= function(){
				var gridOption={
					paginationPageSizes: [10,20, 50, 75],
					paginationPageSize: 10,
					enableColumnMenus:false,
					enableScrollbars :true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 1
				};
				gridOption.data=[];
				gridOption.columnDefs = [
					{ name:'Type',field:'name',cellTooltip: true},
					{ name:'Status',field:'success',cellTooltip: true},
					{ name:'Data',
					  cellTemplate:'<ul><li title="{{actionKey}} : {{actionValue.join() || actionValue}}" ng-repeat="(actionKey, actionValue) in row.entity.actionData">{{actionKey}} : {{actionValue.join() || actionValue}}</li></ul>'},
					{ name:'Timestamp',
					  cellTemplate:'<span title="{{row.entity.timeStarted  | timestampToLocaleTime}}">{{row.entity.timeStarted  | timestampToLocaleTime}}</span>'},
					{ name:'Users',field:'user',cellTooltip: true},
					{ name:'More Info',
					  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.moreInfo(row.entity)"></i></div>'}
				];
				if (cpInstance._id) {
					workzoneServices.getInstanceActionLogs(cpInstance._id).then(function(response){
						gridOption.data = response.data;
					});
				}
				cpActCtrl.gridOptions= gridOption;
			};

			$scope.moreInfo = function(actionHistoryData){
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instancelog.html',
					controller: 'cpActionHistoryLogCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								actionHistoryData: actionHistoryData,
								cpInstance : cpInstance
							};
						}
					}
				});
				modalInstance.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
				}, function() {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			return cpActCtrl;
		}]).controller('cpActionHistoryLogCtrl',['$scope', '$modalInstance', 'items', 'workzoneServices', 'instanceSetting', '$interval',function($scope, $modalInstance, items, workzoneServices, instanceSetting, $interval){
			var _instance = items.cpInstance;
			var _actionItem = items.actionHistoryData;
			var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function(logObj) {
					if (logObj instanceof Array && logObj.length) {
						return logObj[logObj.length - 1].timestamp;
					}
				},
				logsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getActionHistoryLogs(_instance._id,_actionItem._id)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logList.push(response.data);
								}
							});
					}, instanceSetting.logCheckTimer * 100);
				},
				stopPolling: function() {
					$interval.cancel($scope.timerObject);
				}
			};

			angular.extend($scope, {
				logList: [],
				cancel: function() {
					helper.stopPolling();
					$modalInstance.dismiss('cancel');
				},
				timerObject: undefined
			});

			workzoneServices.getActionHistoryLogs(_instance._id,_actionItem._id).then(function(response) {
				helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
				$scope.logList = response.data;
				console.log("check",response);
				helper.logsPolling();
			});

			$scope.$on('$destroy', function() {
				$interval.cancel($scope.timerObject);
			});
		}
	]);
})();