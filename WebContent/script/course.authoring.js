/*
  * Course Authoring Javascript Controller
 * Author: Chi Zhang, Fei Han, Haoda Zou, Weichuan Hong
 * Group 3
 * INFSCI 2470 Final Project
 */

/*
 * 
 * Course Authoring whole scale
 * 
 */

//Course authoring initialize
var CA = CA || {},
	centralUrl = "http://"+document.domain+":8080/toolsuc/";


CA.Parent = function() {};
CA.Child = function() {};

//every module should be in CA object
CA.nameSpace = function(ns){
	var parts = ns.split('.'),
		parent = CA,
		i;
	
	if(parts[0] === 'CA'){
		parts = parts.slice(1);
	}
	
	for(i = 0; i < parts.length; i++){
		if(typeof(parent[parts[i]]) === 'undefined'){
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}
	return parent;
};

//use nameSpace function to safely create objects
//UnitList
//There is a function in java called UnitGetList, I don't know where should I put it.
CA.nameSpace('unitList');
CA.unitList = {};

//warehouse for current data
CA.nameSpace('wareHouse');
CA.wareHouse = {
	domains : [],
	courses : [],
	activities : [],
	authors : [],
	providers : []
};

/*
 * 
 * Actions
 * 
 */
CA.nameSpace('actions');
CA.actions = {
		//current operation pointer
		pointer : {
			//username and group info
			usr : '',
			grp : 'admins',
			//currently operating course, activity, provider
			cid : '',
			cIdx : '',
			aid : '',
			uid : '',
			uIdx : '',
			rid : '',
			pid : '',
			itemTargetIdx : '',
		},
		
		//pointer resetter
		resetP : function(){
			this.pointer.cid = '';
			this.pointer.cIdx = '';
			this.pointer.aid = '';
			this.pointer.uid = '';
			this.pointer.uIdx = '';
			this.pointer.rid = '';
			this.pointer.pid = '';
			this.pointer.itemTargetIdx = ''
		},
		
		init : function(usr){
			this.pointer.usr = usr;
			//deploy dialogs in advance
			CA.deploy.windows();
			//deploy preview panel
			CA.deploy.preview();
			//get all data needed from the server (stupid and slow)
			CA.request('GetData', {
				usr : this.pointer.usr,
				grp : this.pointer.grp
			});
		},

		//return the row of current course
		getCInfo : function(){
			for(var i = 0; i < CA.wareHouse.courses.length; i++){
			}
		},
		
		//return the name of one certain resource
		getResourceName : function(rId){
			for(var i = 0; i < CA.wareHouse.courses[this.pointer.cIdx].resources.length; i++){
				var id = CA.wareHouse.courses[this.pointer.cIdx].resources[i].id;
				if(id == rId){
					var name = CA.wareHouse.courses[this.pointer.cIdx].resources[i].name;
					return name;
				}
			}
		},
		
		//return one row of activity
		getOneActivity : function(aId){
			for(var i = 0; i < CA.wareHouse.activities.length; i++){
				var id = CA.wareHouse.activities[i].id;
				if(id == aId){
					var row = CA.wareHouse.activities[i];
					//console.log(row);
					return row;
				}
			}
		},
		
		//get the formatted action list
		getActivities : function(uIdx){
			//get the correct resource list
			var rList = CA.wareHouse.courses[this.pointer.cIdx].resources,
				wholeList = CA.wareHouse.courses[this.pointer.cIdx].units[uIdx].activityIds,
				aList = {};

			for(var i = 0; i < rList.length; i++){
				var rId = rList[i].id;
				var rName = rList[i].name;
				//get resourse names
				aList[rId+'-'+rName] = [];
				
				//get activity id and names
				if(!(typeof(wholeList[rId]) === 'undefined')){
					for(var j = 0; j < wholeList[rId].length; j++){
						var aId = wholeList[rId][j];
						var aInfo = this.getOneActivity(aId);
						aList[rId+'-'+rName].push(aInfo);
					}
				}
			}
			console.log(aList);
			return aList;
		},
		
		//return formatted domain object
		getDomains : function(){
			var domain = {};
			for(var i = 0; i < CA.wareHouse.domains.length; i++){
				domain[CA.wareHouse.domains[i].id] = CA.wareHouse.domains[i].name;
			}
			return domain;
		},
		
		//return all possible providers for this course
		getPros : function(){
			var dId = CA.wareHouse.courses[this.pointer.cIdx].domainId,
				providers = CA.wareHouse.providers,
				pList = [];
			
			for(var i = 0; i < providers.length; i++){
				if(dId == providers[i].domainId){
					pList.push(providers[i]);
				}
			}
			return pList;
		},
		
		//gives out an activity list for display
		getPool : function(rId){
			var query = this.gather.activityQuery(rId),
				whole = CA.wareHouse.activities,
				len = whole.length,
				rs = [],
				i, j, a;
			console.log('Now, pool list is searched by following query:')
			console.log(query);
			
			for (i = 0; i < len; i++){
				a = whole[i];
				if(a.authorId == query.auid){
					for(j = 0; j < query.providers.length; j++){
						if(a.providerId == query.providers[j]){
							if(query.patt1.test(a.name) || query.patt2.test(a.name)){
								rs.push(a);	
							}
						}
					}
				}
			}
			
			return(rs);
		},
		
		//object to gather form information
		gather : {			
			courseEdit : function(){
				var newData = {},
					dialog = $('.metainfo');
				//get the name
				newData.name = dialog.find('.cName').val().trim();
				//get the code
				newData.code = dialog.find('.cCode').val().trim();
				//get the domain
				newData.domain = dialog.find('.cDomain option:selected').prop('value');
				//get the visible
				var v = dialog.find('.cVisible').prop('checked');
				newData.visible = v ? 1 : 0;
				return newData;
			},
			
			courseAdd : function(){
				var newData = {},
					dialog = $('#cAddDialog');
				//get the name
				newData.name = dialog.find('.cName').val().trim();
				//get the code
				newData.code = dialog.find('.cCode').val().trim();
				//get the domain
				newData.domain = dialog.find('.cDomain option:selected').prop('value');
				//get the visible
				var v = dialog.find('.cVisible').prop('checked');
				newData.visible = v ? 1 : 0;
				return newData;
			},
			
			activityQuery : function(rId){
				var query = {};
					query.providers = [];
					resources = CA.wareHouse.courses[CA.actions.pointer.cIdx].resources;
				
				for(i = 0; i < resources.length; i++){
					if(resources[i].id == rId){
						var plist = resources[i].providerIds;
						for(j = 0; j < plist.length; j++){
							query.providers.push(plist[j]);
						}
					}
				}
				
				query.auid = $('#tabs' + rId + ' .pool .author .aAuthor option:selected').attr('value');
				
				var keyword = $('#tabs' + rId + ' .pool .filter .aQuery').val();
				query.patt1 = new RegExp('^'+keyword, 'i');
				query.patt2 = new RegExp(keyword, 'gi');
				
				return query; 
			}
		},
		
		startEdit : function(args){
			if(this.pointer.cIdx === ''){
				CA.view.infoMsg('Please select a course in the list first.');
			}else{
				//open the panel
				switch(args){
				case 'meta':
					CA.view.drawer.accordion('option', 'active', 1);
					break;
				case 'clone':
					CA.view.drawer.accordion('option', 'active', 0);
					$('#cCloDialog').find('.cName').val('');
					return $('#cCloDialog').dialog('open');
				case 'del':
					CA.view.drawer.accordion('option', 'active', 0);
					$('#cDelDialog').find('.confirm').val('');
					return $('#cDelDialog').dialog('open');
				default:
					CA.view.drawer.accordion('option', 'active', 2);
				}
			}
		},
		
		actionCheck : function(actionName, data){
			if(actionName === 'GetData' || actionName === 'CourseClone' || actionName === 'CourseAdd'){
				console.log('permitted');
				return true;
			}else{
				var courses = CA.wareHouse.courses;
				for(var i = 0; i < courses.length; i++){
					if(courses[i].id === data.course_id){
						return  courses[i].isMy;
					}
				}
			}
		},
		
		//ActSetIdx()
		ActSetIdx : function(idx, newIdx){
			console.log('now doing activity index change');
			var index = parseInt(idx), newIndex = parseInt(newIdx);
			//console.log(this.pointer);
			//console.log(index + ' ' + newIndex);
			if(index < newIndex){
				console.log('the item is descending');
				var aId = CA.wareHouse.courses[this.pointer.cIdx].units[this.pointer.uIdx]
					.activityIds[this.pointer.rid][index+1];
				CA.request('ActSetIdx', {idx:index, course_id:this.pointer.cid, unit_id:this.pointer.uid,
					act_id:aId, res_id:this.pointer.rid, idxDelta:'1'});
			}else if(index > newIndex){
				console.log('the item is ascending');
				var aId = CA.wareHouse.courses[this.pointer.cIdx].units[this.pointer.uIdx]
					.activityIds[this.pointer.rid][index-1];
				CA.request('ActSetIdx', {idx:index, course_id:this.pointer.cid, unit_id:this.pointer.uid,
					act_id:aId, res_id:this.pointer.rid, idxDelta:'-1'});
			}
		},
		
		//ResSetIdx
		ResSetIdx : function(idx, newIdx){
			console.log('now doing resource index change');
			var index = parseInt(idx), newIndex = parseInt(newIdx);
			//which is smaller
			if(index < newIndex){
				console.log('the item is descending');
					var rId = CA.wareHouse.courses[this.pointer.cIdx].resources[index+1].id;
					CA.request('ResSetIdx', {idx:index, course_id:this.pointer.cid, res_id:rId, idxDelta:'1'});	
			}else if(index > newIndex){
				console.log('the item is ascending');
				var rId = CA.wareHouse.courses[this.pointer.cIdx].resources[index-1].id;
				CA.request('ResSetIdx', {idx:index, course_id:this.pointer.cid, res_id:rId, idxDelta:'-1'});
			}
		},
		
		//UnitSetIdx
		UnitSetIdx : function(idx, newIdx){
			console.log('now doing unit index change');
			//which is smaller
			var index = parseInt(idx), newIndex = parseInt(newIdx);
			console.log(index + ' ' + newIndex);
			if(index < newIndex){
				console.log('the item is descending');
				var uId = CA.wareHouse.courses[this.pointer.cIdx].units[index+1].id;
				//console.log('index is ' + i + ' and the other ID is '+ uId);
				CA.request('UnitSetIdx', {idx:index, course_id:this.pointer.cid, unit_id:uId, idxDelta:'1'});
			}else if(index > newIndex){
				console.log('the item is ascending');
				var uId = CA.wareHouse.courses[this.pointer.cIdx].units[index-1].id;
				CA.request('UnitSetIdx', {idx:index, course_id:this.pointer.cid, unit_id:uId, idxDelta:'-1'});
			}
		},
		
		//CourseAdd()
		CourseAdd : function(obj){
			console.log(obj)
			CA.request('CourseAdd',{name:obj.name, code:obj.code, desc:obj.desc, domain:obj.domain,
				visible:obj.visible, usr:this.pointer.usr});
		},
		
		//CourseClone()
		CourseClone : function(name){
			CA.request('CourseClone', {course_id:this.pointer.cid, name:name, usr:this.pointer.usr});
		},

		//CourseDelete()
		CourseDelete : function(str){
			if(str === 'DELETE'){
				console.log('confirmed to delete');
				CA.request('CourseDelete',{course_id:this.pointer.cid});
			}else{
				CA.view.infoMsg('Please check your type. [use UPPERCASE]');
			}
		},

		//CourseEdit()
		CourseEdit : function(obj){
			console.log(obj);
			CA.request('CourseEdit',{course_id:this.pointer.cid, name:obj.name, code:obj.code,
				desc:obj.desc, domain:obj.domain, visible:obj.visible, usr:this.pointer.usr});
		},

		//ResAdd()
		ResAdd : function(name){
			var len = name.length;
			if(len == 0 || len === 'undefined'){
				CA.view.infoMsg('Please enter a name.');
			}else{
				CA.request('ResAdd',{course_id:this.pointer.cid, name:name,	usr:this.pointer.usr});
			}
		},

		//ResDelete
		ResDelete : function(str){
			if(str === 'DELETE'){
				console.log('confirmed to delete');
				CA.request('ResDelete',{course_id:this.pointer.cid, res_id:this.pointer.rid});
			}else{
				CA.view.infoMsg('Please check your type. [use UPPERCASE]');
			}
		},

		//ResEdit
		ResEdit : function(name){
			console.log(CA.actions.pointer);
			console.log('new name is: ' + name);
			CA.request('ResEdit',{name:name, course_id:this.pointer.cid, res_id:this.pointer.rid});
		},

		//ResProvAdd
		ResProvAdd : function(){
			console.log(this.pointer);
			CA.request('ResProvAdd',{course_id:this.pointer.cid, res_id:this.pointer.rid, prov_id:this.pointer.pid});
		},

		//ResProvRemove
		ResProvRemove : function(){
			console.log(this.pointer);
			CA.request('ResProvRemove',{course_id:this.pointer.cid, res_id:this.pointer.rid, prov_id:this.pointer.pid});
		},

		//UnitAdd
		UnitAdd : function(name){
			var len = name.length;
			if(len == 0 || len === 'undefined'){
				CA.view.infoMsg('Please enter a name.');
			}else{
				CA.request('UnitAdd',{course_id:this.pointer.cid, usr:this.pointer.usr, name:name});
			}
		},

		//UnitAddAct
		UnitAddAct : function(){
			console.log('\nAbout to add new activity to this unit, this is the pointer now');
			console.log(this.pointer);
			
			CA.request('UnitAddAct',{
				usr : this.pointer.usr,
				course_id : this.pointer.cid,
				unit_id : this.pointer.uid,
				res_id : this.pointer.rid,
				act_id : this.pointer.aid
			});
		},

		//UnitDelete
		UnitDelete : function(str){
			if(str === 'DELETE'){
				console.log('confirmed to delete');
				CA.request('UnitDelete',{course_id:this.pointer.cid, unit_id:this.pointer.uid});
			}else{
				CA.view.infoMsg('Please check your type. [use UPPERCASE]');
			}
		},

		//UnitEdit
		UnitEdit : function(name){
			console.log(CA.actions.pointer);
			console.log('new name is: ' + name);
			
			var len = name.length;
			if(len == 0 || len === 'undefined'){
				CA.view.infoMsg('Please enter a name.');
			}else{
				CA.request('UnitEdit',{name:name, course_id:this.pointer.cid, unit_id:this.pointer.uid});
			}
		},

		//UnitGetList
		//There might be a typo in java class. It should be UnitGetList instead of UnitGetLst
		UnitGetLst : function(){
			CA.request('UnitGetLst',{
				course_id : this.pointer.cid
				})
		},

		//UnitRemoveAct
		UnitRemoveAct : function(){
			console.log('confirmed to delete, now the pointer is:');
			console.log(CA.actions.pointer);
			CA.request('UnitRemoveAct',{
				course_id : this.pointer.cid,
				unit_id : this.pointer.uid,
				res_id : this.pointer.rid,
				act_id : this.pointer.aid
			});
		},
};

/*
 * 
 * 
 * Ajax Request Part
 * 
 */
//universal request sender
CA.nameSpace('request');
CA.request = function(actionURL, args){
	var checkRs = CA.actions.actionCheck(actionURL, args);
	if(checkRs){
		$.get(actionURL, args, function(data){
			//using eval is an unsafe method, however I haven found out an alternative way
			//since the text from servlet is not standard JSON string
			rs = eval('(' + data + ')');
			CA.receive(actionURL, rs);
		}, "text");
	}else{
		CA.view.infoMsg('You do not have the right to do so, because this is not your course.');
		return false;
	}
};

//universal receiver
CA.nameSpace('receive');
CA.receive = function(actionName, rs){
	//use error handler to feedback
	if(typeof(rs) === 'undefined')
		this.ajaxError('Unable to connect to the server.');
	CA.outcomeValidation(actionName, rs);
	//call relevant handler to further process the result
//	this[actionName + 'Handler'](rs);
};

//outcome validation
CA.nameSpace('outcomeValidation');
CA.outcomeValidation = function(actionName, rs){
	if(rs.outcome == "true"){
		this.handlers[actionName + 'Handler'](rs);
	}else{
		console.log("Fail to execute database.")
	}
};


//universal ajaxError handler
CA.nameSpace('ajaxError');
CA.ajaxError = function(etype){
	console.log(etype);
};

//handlers of Ajax request
CA.nameSpace('handlers');
CA.handlers = {
		//GetData receive handler
		GetDataHandler : function(rs){
			CA.wareHouse.domains = rs.data.domains;
			CA.wareHouse.courses = rs.data.courses;
			CA.wareHouse.activities = rs.data.activities;
			CA.wareHouse.authors = rs.data.authors;
			CA.wareHouse.providers = rs.data.providers;
			//initialize the display for the first time
			CA.view.init();
		},
		
		//ActSetIdx receive handler
		ActSetIdxHandler : function(rs){
			var index = parseInt(rs.idx);
			console.log('results:');
			console.log(rs);
			//get the right listName
			var listName = rs.resId;
			//call next move
			CA.view.dragListRender.newSeq(listName, rs.idx, (parseInt(rs.idx) + parseInt(rs.idxDelta)));
			if(rs.idxDelta > 0){
				CA.actions.ActSetIdx(index + 1, CA.actions.pointer.itemTarIdx);
			}else if(rs.idxDelta < 0){
				CA.actions.ActSetIdx(index - 1, CA.actions.pointer.itemTarIdx);
			}
		},
		
		//ResSetIdx receive handler
		ResSetIdxHandler : function(rs){
			var index = parseInt(rs.idx);
			console.log('results:');
			console.log(rs);
			//call next move
			CA.view.dragListRender.newSeq('resources', rs.idx, (parseInt(rs.idx) + parseInt(rs.idxDelta)));
			if(rs.idxDelta > 0){
				CA.actions.ResSetIdx(index + 1, CA.actions.pointer.itemTarIdx);
			}else if(rs.idxDelta < 0){
				CA.actions.ResSetIdx(index - 1, CA.actions.pointer.itemTarIdx);
			}
		},

		//UnitSetIdx receive handler
		UnitSetIdxHandler : function(rs){
			var index = parseInt(rs.idx);
			//console.log('results:');
			console.log(rs);
			CA.view.dragListRender.newSeq('units', rs.idx, (parseInt(rs.idx) + parseInt(rs.idxDelta)));
			//call next move
			if(rs.idxDelta > 0){
				CA.actions.UnitSetIdx(index + 1, CA.actions.pointer.itemTarIdx);
			}else if(rs.idxDelta < 0){
				CA.actions.UnitSetIdx(index - 1, CA.actions.pointer.itemTarIdx);
			}
		},
		
		//CourseAdd receive handler
		CourseAddHandler : function(rs){
			newCourse = rs.course;
			CA.wareHouse.courses.push(newCourse);
			console.log('\nAdd completed. Here is the result:');
			console.log(rs);
			//update courseInfo
			CA.courseTable.destroy();
			CA.view.initCList();
			//close the dialog
			$('#cAddDialog').dialog('close');
		},

		//CourseClone receive handler
		CourseCloneHandler : function(rs){
			newCourse = rs.course;
			CA.wareHouse.courses.push(newCourse);
			//update courseInfo
			CA.courseTable.destroy();
			CA.view.initCList();
			//close the clone dialog
			$('#cCloDialog').dialog('close');
			//remind the user it is cloned
			CA.view.infoMsg('Course cloned.');
		},
		
		//CourseDelete receive handler
		CourseDeleteHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					CA.wareHouse.courses.splice(i,1);
					break;
				}
			}
			console.log('\nDeletion completed. Here is the result:');
			console.log(CA.wareHouse.courses);
			//close the dialog
			$('#cDelDialog').dialog('close');
			//update courseInfo
			CA.courseTable.destroy();
			CA.view.initCList();
			CA.view.updateNotifier('reset');
			CA.actions.pointer.cIdx = '';
			//remind the user the course is deleted
			CA.view.infoMsg('Course deleted.');
		},
		
		//CourseEdit receive handler
		CourseEditHandler : function(rs){
			//add a new row to the course list
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.course.id){
					CA.wareHouse.courses[i] = rs.course;
					break;
				}
			}
			console.log('\nEdit completed. Here is the result:');
			console.log(CA.wareHouse.courses[CA.actions.pointer.cIdx]);
			//update courseInfo
			CA.view.cInfoRefresh();
			//remind the user it is edited
			CA.view.infoMsg('Course info updated.');
		},

		//ResAdd receive handler
		ResAddHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					rs.res.providerIds = [];
					CA.wareHouse.courses[i].resources.push(rs.res);
					break;
				}
			}
			console.log('\nAdd completed. Here is the result:');
			console.log(rs);
			console.log(CA.wareHouse.courses[CA.actions.pointer.cIdx].resources);
			//refresh resources
			CA.view.initCourse.refreshRList();
			//close the dialog
			$('#rAddDialog').dialog('close');
			//remind the user it is added
			CA.view.infoMsg('Resource added to the last. And the unit\'s activity list has been refreshed.');
		},
		
		//ResDelete receive handler
		ResDeleteHandler : function(rs){
			console.log('yes');
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].resources.length; j++){
						if(CA.wareHouse.courses[i].resources[j].id == rs.resId){
							CA.wareHouse.courses[i].resources.splice(j,1);
							break;
						}
					}
					break;
				}
			}
			console.log('\nDeletion completed. Here is the result:');
			console.log(rs);
			//refresh resources
			CA.view.initCourse.refreshRList();
			//close the dialog
			$('#rDelDialog').dialog('close');
			//remind the user it is edited
			CA.view.infoMsg('Resource deleted. And the unit\'s activity list has been refreshed.');
		},
		
		//ResEdit receive handler
		ResEditHandler : function(rs){
			//modify the info in wareHouse
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].resources.length; j++){
						if(CA.wareHouse.courses[i].resources[j].id == rs.resId){
							var newrs = CA.wareHouse.courses[i].resources[j];
							newrs.id = rs.resId;
							newrs.name = rs.name;
							CA.wareHouse.courses[i].resources[j] = newrs;
							break;
						}
					}
					break;
				}
			}
			console.log('\nEdit completed. Here is the result:');
			console.log(CA.wareHouse.courses[CA.actions.pointer.cIdx].resources);
			//refresh resources
			CA.view.initCourse.refreshRList();
			//close the dialog
			$('#rEditDialog').dialog('close');
			//remind the user it is edited
			CA.view.infoMsg('Resource info updated. And the unit\'s activity list has been refreshed.');
		},

		//ResProvAdd receive handler
		ResProvAddHandler : function(rs){
			var index;
			console.log('Modifying wareHouse');
			//modify the info in wareHouse
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].resources.length; j++){
						if(CA.wareHouse.courses[i].resources[j].id == rs.resId){
							CA.wareHouse.courses[i].resources[j].providerIds.push(rs.provId);
							index = j;
							break;
						}
					}
					break;
				}
			}
			//refresh the list
			CA.view.initCourse.refreshProviders(index);
		},

		//ResProvRemove receive handler
		ResProvRemoveHandler : function(rs){
			var index;
			console.log('Modifying wareHouse');
			//modify the info in wareHouse
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].resources.length; j++){
						if(CA.wareHouse.courses[i].resources[j].id == rs.resId){
							index = j;
							for(k = 0; k< CA.wareHouse.courses[i].resources[j].providerIds.length; k++){
								if(CA.wareHouse.courses[i].resources[j].providerIds[k] == rs.provId){
									CA.wareHouse.courses[i].resources[j].providerIds.splice(k,1);
									break;
								}
							}
							break;
						}
					}
					break;
				}
			}
			//refresh the list
			CA.view.initCourse.refreshProviders(index);
		},
		
		//UnitAdd receive handler
		UnitAddHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					rs.unit.activityIds = [];
					var res = CA.wareHouse.courses[i].resources;
					for(var j = 0; j < res.length; j++){
						rs.unit.activityIds[res[j].id] = [];
					}
					CA.wareHouse.courses[i].units.push(rs.unit);
					break;
				}
			}
			console.log('\nAdd completed. Here is the result:');
			console.log(rs);
			//update the unit list
			CA.view.refreshUnits();
			//close the dialog
			$('#uAddDialog').dialog('close');
			//remind the user it is added
			CA.view.infoMsg('New unit has been added to the last.');
		},
		
		//UnitAddAct receive handler
		UnitAddActHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].units.length; j++){
						if(CA.wareHouse.courses[i].units[j].id == rs.unitId){
							if(CA.wareHouse.courses[i].units[j].activityIds[rs.resId] == undefined){
								CA.wareHouse.courses[i].units[j].activityIds[rs.resId] = [];
							}
							CA.wareHouse.courses[i].units[j].activityIds[rs.resId].push(rs.actId);
							break;
						}
					}
					break;
				}
			}
			console.log('\nActivity added, here is the result:');
			console.log(rs);
			//refresh the list
			var rIdx = ($('#rTab ul').children('li.ui-tabs-active').index());
			CA.view.refreshActivities(CA.actions.pointer.uIdx, rIdx);
		},

		//UnitDelete receive handler
		UnitDeleteHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].units.length; j++){
						if(CA.wareHouse.courses[i].units[j].id == rs.unitId){
							CA.wareHouse.courses[i].units.splice(j,1);
							break;
						}
					}
					break;
				}
			}
			console.log('\nDeletion completed. Here is the result:');
			console.log(rs);
			//update the unit list
			CA.view.refreshUnits();
			//clear things
			$('#rTab ul').children().remove();
			$('#rTab div').remove();
			//close the dialog
			$('#uDelDialog').dialog('close');
			//remind the user it is edited
			CA.view.infoMsg('Unit deleted. And the unit list has been refreshed.');
		},
		
		//UnitEdit receive handler
		UnitEditHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].units.length; j++){
						if(CA.wareHouse.courses[i].units[j].id == rs.unitId){
							var newUnit = CA.wareHouse.courses[i].units[j];
							newUnit.name = rs.name;
							CA.wareHouse.courses[i].units[j] = newUnit;
							break;
						}
					}
					break;
				}
			}
			console.log('\nEdit completed. Here is the result:');
			console.log(CA.wareHouse.courses[CA.actions.pointer.cIdx].units);
			//update the unit list
			CA.view.refreshUnits();
			//close the dialog
			$('#uEditDialog').dialog('close');
			//remind the user it is edited
			CA.view.infoMsg('Unit info updated.');
		},

		//UnitGetList receive handler
		UnitGetLstHandler : function(rs){
			CA.unitList = rs;
			console.log(CA.unitList);
		},

		//UnitRemoveAct receive handler
		UnitRemoveActHandler : function(rs){
			for(i = 0; i < CA.wareHouse.courses.length; i++){
				if(CA.wareHouse.courses[i].id == rs.courseId){
					for(j = 0; j < CA.wareHouse.courses[i].units.length; j++){
						if(CA.wareHouse.courses[i].units[j].id == rs.unitId){
							for(k = 0; k < CA.wareHouse.courses[i].units[j].activityIds[rs.resId].length; k++){
								if(CA.wareHouse.courses[i].units[j].activityIds[rs.resId][k] == rs.actId){
									CA.wareHouse.courses[i].units[j].activityIds[rs.resId].splice(k,1);
									break;
								}
							}
							break;
						}
					}
					break;
				}
			}
			console.log('\nDeletion completed. Here is the result:');
			console.log(rs);
			//refresh the list
			CA.view.refreshActivities(CA.actions.pointer.uIdx, $('#rTab ul').find('.ui-tabs-active').index());
			//close the dialog
			$('#aDelDialog').dialog('close');
			//remind the user it is edited
			CA.view.infoMsg('Activity deleted.');
		},
};

/*
 * 
 * Format
 * 
 */
CA.nameSpace('format');
CA.format = {
		p : CA.actions.pointer,
		wareH : CA.wareHouse,
		
		shortenDomain : function(longDomainName){
			//shorten the domain name
			if(longDomainName.indexOf("Java")>=0)
				longDomainName="Java";
			else if(longDomainName.indexOf("SQL")>=0)
				longDomainName="SQL";
			else if(longDomainName.indexOf("C++")>=0)
				longDomainName="C++";
			else if(longDomainName.indexOf("C")>=0)
				longDomainName="C";
			return longDomainName;
		},

		courseList : function(){
			var clist = CA.wareHouse.courses,
				domains = CA.actions.getDomains(),
				dataset = [], row = [];
		
			for(var i = 0; i < clist.length; i++){
				var cInfo = clist[i],
					mine = ' ',
					date = new Date(cInfo.created.on);
				
				if(cInfo.isMy == true){
					//if the course is created by current user
					mine = '<img src="public/M.png">';
				}
				
				row = [mine,
						this.shortenDomain(domains[cInfo.domainId]),
						cInfo.num,
						cInfo.name,
						cInfo.created.by, 
						cInfo.institution,
						date.getFullYear() + '-' + date.getMonth(), 
						cInfo.groupCount,
						i];
				if(cInfo.isMy == false && cInfo.visible == "0"){
					break;
				}else{
					dataset.push(row);
				}
			}
			
			return dataset;
		},
		
		unitList : function(){
			//return a unit list html
			var units = CA.wareHouse.courses[this.p.cIdx].units;
			var html = '';
			for(var i = 0; i < units.length; i++){
				html += '<li>' + units[i].name + '</li>';
			}
			 return html;
		},
		
		//return a resource list html
		rList : function(){
			console.log(CA.wareHouse.courses[CA.actions.pointer.cIdx].resources);
			var rs = this.wareH.courses[this.p.cIdx].resources,
				html = '';
			for(var i = 0; i < rs.length; i++){
				html += '<li>' + rs[i].name + '</li>';
			}
			 return html;
		},
		
		resourceList : function(){
			var rs = this.wareH.courses[this.p.cIdx].resources;
			var html = {
					ul : '',
					div : '',
					rNo : rs.length,
			};
			
			for(var i = 0; i < rs.length; i++){
				html.ul += '<li><a href="#tabs' + rs[i].id + '" rid="' + rs[i].id + '">' + rs[i].name + '</a></li>';
				html.div += '<div id="tabs' + rs[i].id + '">' +
							'<div class="aList"><div class="title1">Selected Activities</div><div class="plate aplate"><ol class="activities"></ol></div>' +
							'<div class="funcWrapper" id="aFunction"><ul class="functions ui-widget ui-helper-clearfix"><li class="ui-state-default ui-corner-all" title="Delete this activity"><span class="delAct ui-icon ui-icon-trash"></span></li></ul>' + 
							'</div></div>' +
							'<div class="pool">' +
							'<div class="author"><label>Author:</label><select class="aAuthor"></select></div>' +
							'<div class="filter"><label>Keywords:</label><input class="aQuery"></input></div>' +
							'<div class="pList"><label>Available Activities:</label>' +
							'<div class="plate pplate"><ol class="pool"></ol></div></div>' +
							'</div><div style="clear:both;"></div></div>';
			}
			return html;
		},
		
		activityList : function(list){
			var html = '';
			if(list === undefined){
				return html;
			}
			console.log(list);
			for(var i = 0; i < list.length; i++){
				var row = CA.actions.getOneActivity(list[i]);
				html += '<li>'+ row.name +'<a onclick="CA.view.preview(\'' + row.url + '\')">Preview</a></li>';
			}
			return html;
		},
		
		providerList : function(e){
			var rs = this.wareH.courses[this.p.cIdx].resources[e].providerIds,
				html = '',
				ps = this.wareH.providers;
			for(var i = 0; i < rs.length; i++){
				for(var j = 0; j < ps.length; j++){
					if(ps[j].id == rs[i]){
						html += '<li>' + ps[j].name + '</li>';
						break;
					}
				}
			}
			return html;
		},
		
		authorList : function(e){
			var html = '';
			for(var i = 0; i < e.length; i++){
				html += '<option value="' + e[i].id + '">' + e[i].name + '</option>';
			}
			return html;
		},
		
		poolList : function(rId){
			var html = '',
				list = CA.actions.getPool(rId);
			for(var i = 0; i < list.length; i++){
				html += '<li aid="' + list[i].id + '">' + list[i].name +'<a onclick="CA.view.preview(\'' + list[i].url + '\')">Preview</a></li>';
			}
			return html;
		},
		
		providerPool : function(){
			var info = CA.actions.getPros(),
				html = '';
			for(var i = 0; i < info.length; i++){
				html += '<li pid="' + info[i].id + '">' + info[i].name + '</li>';
			}
			return html;
		},
};


/*
 * 
 * Display Part
 * 
 */
//view object is the controller of DOM operations
CA.nameSpace('view');
CA.view = {
		p : CA.actions.pointer,
		wareH : CA.wareHouse,
		//drawer is the accordion object
		drawer : {},
		
		init : function(){
			//put user info into the div
			$('#userInfo').html("Welcome " + this.p.usr + "! Click <a href=\""+ centralUrl +"\">here</a> to go back to the portal.");
			this.drawer = $('#ca').accordion({
				heightStyle: "fill",
			});
			
			this.drawer.on( "accordionbeforeactivate", function(event, ui){
				var cIdx = CA.actions.pointer.cIdx;
				if(cIdx === ''){return false;};
			});
			
			//make each panel in different color
			var title = this.drawer.find('h3');
			title.hover(function(){$(this).removeClass('ui-state-hover');});
			title.eq(0).css({'background': '#EAFF68', 'color': '#707F15'});
			title.eq(1).css({'background': '#68FF9E', 'color': '#157F3B'});
			title.eq(2).css({'background': '#CEF7FF', 'color': '#1E6F7F'});
			return this.initCList();
		},
		
		initCList : function(){
			this.updateNotifier('reset');
			var clist = CA.format.courseList();
			CA.courseTable = CA.deploy.courseList(clist);
			var tbody = $('#course-table tbody');
			tbody.on('click', 'tr', function(){
				$(this).addClass('selected').siblings().removeClass('selected');
				var rData = CA.courseTable.row(this).data(),
					cIdx = rData[8],
					cId = CA.wareHouse.courses[cIdx].id;
				//update the pointer
				CA.actions.pointer.cIdx = cIdx;
				CA.actions.pointer.cid = cId;
				//init the workbench
				CA.view.initWorkbench();
			});
			//topic edit button
			$('button.edit_t').click(function(){CA.actions.startEdit('topic');});
			//metainfo edit button
			$('button.edit_m').click(function(){CA.actions.startEdit('meta');});
			//course clone button
			$('button.clone').click(function(){CA.actions.startEdit('clone');});
			//course add button
			$('button.add').click(function(){
				CA.view.updateNotifier('reset');
				CA.actions.pointer.cIdx = '';
				//fill in the form in dialog
				//add options to the selector
				var dList = CA.actions.getDomains();
				//empty the list
				$('#cAddDialog .cDomain').find('option').remove();
				//insertion
				for(domain in dList){
					option = '<option value="'+domain+'">'+dList[domain]+'</option>';
					$('#cAddDialog .cDomain').append(option);
				};
				//open the dialog
				$('#cAddDialog').dialog('open');
			});
			//course delete
			$('button.del').click(function(){CA.actions.startEdit('del');});
		},
		
		initCourse : {
			canvas : $('#ca div').eq(1),
			p : CA.actions.pointer,
			
			init : function(args){
				switch(args){
				case 'clone':
					break;
				default:
					this.getReady();
					CA.deploy.rList($('.rList'));
					CA.deploy.rProviders($('.proList'));
					//create the button
					bSpace.html('<button class="meta" onclick="CA.actions.CourseEdit(CA.actions.gather.courseEdit())" type="button"><img src="./public/images/edit_ico.png"/>Save</button>');
				}
			},
			
			getReady : function(args){
				switch(args){
				case 'clone':
					break;
				default:
					this.fillCInfo();
					this.refreshRList();
					this.refreshPPool();
				}
			},
			
			fillCInfo : function(){
				var dList = CA.actions.getDomains(),
					thisCourse = CA.wareHouse.courses[CA.actions.pointer.cIdx],
					section = $('.metainfo');
					bSpace = $('.submitAction');
				//empty the list
				section.find('.cDomain option').remove();
				//get this course's domain id
				var domainId = thisCourse.domainId;
				//insertion
				for(domain in dList){
					var option, selected = '';
					if(domainId === domain){
						selected = 'selected="selected"';
					}
					option = '<option '+selected+' value="'+domain+'">'+dList[domain]+'</option>';
					section.find('.cDomain').append(option);
				}
				//make check box right
				if(thisCourse.visible === 1){
					section.find('.cVisible').prop('checked', 'true');
				}else{
					section.find('.cVisible').prop('checked', 'false');
				}
				//fill in the name
				section.find('.cName').val(thisCourse.name);
				//fill in the code
				section.find('.cCode').val(thisCourse.num);
			},
			
			refreshPPool : function(){
				var html = CA.format.providerPool();
					pPool = $('ol.propool');
				//clear things
				pPool.children().remove();
				//fill in
				pPool.html(html);
			    pPool.children('li').draggable({
			    	revert: true,
			    	helper: 'clone',
			    	start: function(event, ui){
			    		$(ui.helper).addClass('a-drag');
			    	}
			    });
			},
			
			refreshRList : function(){
				//receive the rlist
				var html = CA.format.rList(),
					rList = $('ol.resources');
				//clear things
				CA.view.refreshUnits();
				rList.children().remove();
				$('ol.providers').children().remove();
				//fill in
				rList.html(html);
				//sortable
				rList.sortable({
					axis : 'y',
					start : function(event, ui){
						this.originalIndex = ui.item.index();
					}, 
					update : function(event, ui){
						console.log(this.originalIndex + ' ' + ui.item.index());
						CA.view.refreshUnits();
						CA.actions.pointer.itemTarIdx = ui.item.index();
						CA.actions.ResSetIdx(this.originalIndex, ui.item.index());
					}, 
				});
				return this.resourceBond(rList);
			},
			
			resourceBond : function(e){
				var f = this;
				e.children().click(function(){
					var rIdx = $(this).index();
					$(this).addClass('ui-selected').siblings().removeClass('ui-selected');
					f.p.rid = CA.wareHouse.courses[f.p.cIdx].resources[rIdx].id;
					f.refreshProviders(rIdx);
					console.log(f.p);
				});
			},
			
			refreshProviders : function(e){
				//receive the plist
				var html = CA.format.providerList(e),
					pList = $('ol.providers');
				//clear things
				pList.children().remove();
				CA.view.refreshUnits();
				//fill in
				pList.html(html);
				return this.providerBond(pList, e);
			},
			
			providerBond : function(e, rIdx){
				var f = this;
				e.children().click(function(){
					var pIdx = $(this).index();
					$(this).addClass('ui-selected').siblings().removeClass('ui-selected');
					f.p.pid = CA.wareHouse.courses[f.p.cIdx].resources[rIdx].providerIds[pIdx];
					console.log(f.p);
				});
				$('.proplate').droppable({
					tolerance : 'intersect',
					accept : '.ui-draggable',
					drop : function(event, ui){
						f.p.pid = ui.draggable.attr('pid');
						console.log(f.p);
						CA.actions.ResProvAdd();
					}
				});
			},
		},
		
		cInfoRefresh : function(){
			this.updateNotifier('normal');
			CA.courseTable.destroy();
			this.initCList();
		},
		
		initWorkbench : function(){
			this.initCourse.init();
			CA.deploy.units($('.uList'));
			//update the notifier
			this.updateNotifier();
			//unit manipulation
			return this.refreshUnits();
		},
		
		updateNotifier : function(args){
			if(args == 'reset'){
				$('.cNotifyContent').text('Course List');
			}else{
				var curr = this.wareH.courses[this.p.cIdx],
				name = curr.name,
				owner = curr.created.by;
				$('.cNotifyContent').text('Current Course: [' + name + '] Created by ' + owner);
			}
		},
		
		refreshUnits : function(){
			//clear things
			$('.units').children().remove();
			$('#rTab div').remove();
			$('#rTab ul').children().remove();
			//receive the units
			var html = CA.format.unitList();
			$('.units').html(html);
			//sortable
			$('.units').sortable({
				axis : 'y',
				start : function(event, ui){
					this.originalIndex = ui.item.index();
				}, 
				update : function(event, ui){
					console.log(this.originalIndex + ' ' + ui.item.index());
					CA.actions.pointer.itemTarIdx = ui.item.index();
					CA.actions.UnitSetIdx(this.originalIndex, ui.item.index());
				}, 
			});
			return this.unitsBond($('.units'));
		},
		
		unitsBond : function(e){
			var f = this;
			e.children().click(function(){
				f.refreshResources($(this).index());
				$(this).addClass('ui-selected').siblings().removeClass('ui-selected');
				f.p.uIdx = $(this).index();
				f.p.uid = f.wareH.courses[f.p.cIdx].units[f.p.uIdx].id;
				console.log(f.p);
			});
		},
		
		refreshResources : function(idx){
			var f = this;
			//clear things
			$('#rTab ul').children().remove();
			$('#rTab div').remove();
			//console.log('unit index : ' + idx);
			//get resource list
			var html = CA.format.resourceList();
			$('#rTab ul').html(html.ul);
			//apply the tab
			$('#rTab').append(html.div).tabs({
				create : function(event, ui){
					//do something at first time
					//upadate the pointer for the first time
					f.p.rid = ui.tab.find('a').attr('rid');
				},
				activate : function(event, ui){
					//refresh the pointer everytime,
					f.p.rid = ui.newTab.find('a').attr('rid');
				},
			});
			//authors for all tabs
			this.refreshAuthors();
			//keywords for all tabs
			this.refreshKeywords();
			//refresh for each tab
			for(var i = 0; i < html.rNo; i++){
				//activities in this tab
				this.refreshActivities(idx, i);
				//available activitites
				this.refreshPool(i);
			}
			$('#rTab').tabs('refresh');
			//deploy delete activity buttons
			CA.deploy.activities($('#rTab'));
		},
		
		refreshActivities : function(uIdx, rIdx){
			var rId = this.wareH.courses[this.p.cIdx].resources[rIdx].id,
				ol = $('#tabs' + rId + ' .aList .plate ol'),
				f = this;
			//clear things
			ol.children().remove();
			var html = CA.format.activityList(this.wareH.courses[this.p.cIdx].units[uIdx].activityIds[rId]);
			//console.log(html);
			//find the right list to append
			ol.html(html);
			//sortable
			ol.sortable({
				axis : 'y',
				start : function(event, ui){
					this.originalIndex = ui.item.index();
				}, 
				update : function(event, ui){
					console.log(this.originalIndex + ' ' + ui.item.index());
					CA.actions.pointer.itemTarIdx = ui.item.index();
					CA.actions.ActSetIdx(this.originalIndex, ui.item.index());
				}, 
			});
			//droppable
			$('#tabs' + rId + ' .aList .plate').droppable({
				tolerance : 'intersect',
				accept : '.ui-draggable',
				drop : function(event, ui){
					f.p.aid = ui.draggable.attr('aid');
					//console.log(ui.draggable.parent());
					//add
					CA.actions.UnitAddAct();
				}
			});
			//bond activity clickable
			return this.activitiesBond(ol);
		},
		
		activitiesBond : function(e){
			var f = this;
			e.children().click(function(){
				$(this).addClass('ui-selected').siblings().removeClass('ui-selected');
				var aid = f.wareH.courses[f.p.cIdx].units[f.p.uIdx].activityIds[f.p.rid][$(this).index()];
				f.p.aid = aid;
				console.log(f.p);
			});
		},
		
		refreshProviders : function(checked, rIdx){
			var rId = this.wareH.courses[this.p.cIdx].resources[rIdx].id;
			var html = CA.format.providerList(CA.actions.getPros());
			var plist = $('#tabs' + rId + ' .pool .provider ul');
			plist.html(html).children().each(function(){
				var checkbox = $(this).find('input'), id = checkbox.attr('name');
				for(var i = 0; i < checked.length; i++){
					if(id == checked[i]){
						$(this).find('input').prop("checked", true);
					}
				};
				checkbox.change(function(){
					CA.actions.pointer.pid = $(this).attr('name');
					if(this.checked){
						console.log('add a new provider');
						CA.actions.ResProvAdd();
					}else{
						console.log('remove a provider');
						CA.actions.ResProvRemove();
					}
				});
			});
			
		},

		refreshAuthors : function(){
			var html = CA.format.authorList(CA.wareHouse.authors);
			$('select.aAuthor').html(html);
			$('select.aAuthor').change(function(){
				var idx = $(this).parent().parent().parent().parent().children('ul').children('li.ui-state-active').index();
				CA.view.refreshPool(idx);
			});
		},

		refreshKeywords : function(){
			$('input.aQuery').keyup(function(event){
				var idx = $(this).parent().parent().parent().parent().children('ul').children('li.ui-state-active').index();
				//console.log(idx);
				CA.view.refreshPool(idx);
			});
		},
		
		refreshPool : function(rIdx){
			var rId = this.wareH.courses[this.p.cIdx].resources[rIdx].id,
				ol = $('#tabs' + rId + ' .pool .pList .plate ol');
			//clear things
			ol.children().remove();
			var html = CA.format.poolList(rId);
			ol.html(html);
			//draggable
		    ol.children('li').draggable({
		    	revert: true,
		    	helper: 'clone',
		    	start: function(event, ui){
		    		$(ui.helper).addClass('a-drag');
		    	}
		    });
		},
		
		//this part is for the drag's event bind
		dragListRender : {
			
			//fetch the right content for this dragList
			fetchCurrArray : function(require){
				console.log(require);
				switch(require){
				case 'resources':
				case 'units':
					return CA.wareHouse.courses[CA.actions.pointer.cIdx][require];
				default:
					return CA.wareHouse.courses[CA.actions.pointer.cIdx].units[CA.actions.pointer.uIdx].activityIds[require];
				}
			},
			
			//the draglists in the page
			listNames : ['resources', 'units'],
			
			//a function to return the selected item's index
			currItemIdx : function(listName){
				return $('#'+listName+' li.ui-selected').index();
			},
			
			//this is the fill in function
			listFill : function(listName, listArray){
				var len = listArray.length;
				//circularly call the addItem function
				for(var i = 0; i < len; i++){
					if(listName == 'resources' || listName == 'units'){
						this.addItem(listName, listArray[i]['name']);
					}else{
						this.addItem(listName, listArray[i]);
					}
				}
			},
			
			//this is the handler to sequence changes
			newSeq : function(listName, b, e){
				//call the ajax request
				//if success then change the sequence in local array
				//first fetch the original one
				var origin = parseInt(b), destination = parseInt(e);
				
				var arr = this.fetchCurrArray(listName), 
					item = arr[origin],
					i;
				
				if(origin == destination){
					return false;
				}else if(origin < destination){
					//console.log(origin + ' ' + destination);
					for(i = origin; i < destination; i++){
						arr[i] = arr[i + 1];
					}
					arr[destination] = item;
				}else{
					for(i = origin; i > destination; i--){
						arr[i] = arr[i - 1];
					}
					arr[destination] = item;
				};
				//console.log(this.fetchCurrArray(listName));
			},
		},

		//this funcions calls up an alert window
		infoMsg : function(str){
			var icon = '<span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span>';
			$('#infoSign').find('.infoMsg').html(icon+str);
			$('#infoSign').dialog('open');
		},

		preview : function(url){
			var container = $('.preview');
			container.html('<object id="preview_window" type="text/html" data="' + url + '"></object>');
			container.dialog('open');
		},
};


/*
 * 
 * Deploy Part
 * 
 */
//deploy object is the function that initialize the plugin
CA.nameSpace('deploy');
CA.deploy = {
		p : CA.actions.pointer,
		wareH : CA.wareHouse,

		courseList : function(dataset){
			
			return $('#course-table').DataTable({
				"data"	: dataset,
				"paging": false,
				"order"	: [[ 1, "asc" ]],
				"bInfo" : false,
				
				"columns": [
				            { "title": " ", "class": "center", "width" : "20px"},//mine
				            { "title": "Domain", "class": "center" },				            
				            { "title": "Course Code" },
				            { "title": "Course Name" },
				            { "title": "Created by" },
				            { "title": "Institution", "class": "center", "width" : "30px"},				            
				            { "title": "Created on" },
				            { "title": "# of Groups", "class": "center", "width" : "30px"},
				            { "title": "CourseIdx", "visible": false},],
			});
		},
		
		preview : function(){
			$('.preview').dialog({
				autoOpen: false,
				draggable: true,
				height: 300,
				width: 600,
				position:{
					my: 'center',
					at: 'center',
					of: window
				},
				resizable: true,
			});
		},
		
		windows : function(){
			//Window Controls
			//info signs
			$( "#infoSign" ).dialog({
			    autoOpen: false,
			    modal: true,
			    width: 250,
			    buttons: {"OK" : function(){$(this).dialog( "close" );}},
			});
			//dialog divs
			//course choosing dialog
			$( "#cListDialog" ).dialog({
			    autoOpen: false,
			    modal: true,
			    width: 400,
			    height: 400,
			});
			//course editing dialog
			$('#cEditDialog').dialog({
			    autoOpen: false,
			    height: 320,
			    width: 200,
			    modal: true,
			    buttons: {
			      "Submit": function(){
			    	  CA.actions.CourseEdit(CA.actions.gather.courseEdit());
			      },
			      Cancel: function(){$(this).dialog( "close" );}
			    },
			});
			//course add dialog
			$('#cAddDialog').dialog({
			    autoOpen: false,
			    height: 350,
			    width: 300,
			    modal: true,
			    buttons: {
			      "Add": function(){
			    	  CA.actions.CourseAdd(CA.actions.gather.courseAdd());
			      },
			      Cancel: function(){$(this).dialog( "close" );}
			    },
			});
			//course del confirmation dialog
			$('#cDelDialog').dialog({
			    autoOpen: false,
			    height: 230,
			    width: 300,
			    modal: true,
			    buttons: {
			      "Delete": function(){CA.actions.CourseDelete($(this).find('.confirm').val());}
			    },
			});
			//course clone dialog
			$('#cCloDialog').dialog({
			    autoOpen: false,
			    width: 200,
			    modal: true,
			    buttons: {
			      "Clone": function(){CA.actions.CourseClone($(this).find('.cName').val().trim());}
			    },
			});
			//resource edit dialog
			$('#rEditDialog').dialog({
			    autoOpen: false,
			    width: 300,
			    height: 160,
			    modal: true,
			    buttons: {
			      "Submit": function(){CA.actions.ResEdit($(this).find('.rName').val().trim());}
			    },
			});
			//resource add dialog
			$('#rAddDialog').dialog({
			    autoOpen: false,
			    height: 160,
			    width: 300,
			    modal: true,
			    buttons: {"Add": function(){CA.actions.ResAdd($(this).find('.rName').val().trim());}},
			});
			//resource delete dialog
			$('#rDelDialog').dialog({
			    autoOpen: false,
			    height: 230,
			    width: 300,
			    modal: true,
			    buttons: {
			      "Delete": function(){CA.actions.ResDelete($(this).find('.confirm').val());}
			    },
			});
			//unit edit dialog
			$('#uEditDialog').dialog({
			    autoOpen: false,
			    width: 300,
			    height: 160,
			    modal: true,
			    buttons: {
			      "Submit": function(){CA.actions.UnitEdit($(this).find('.uName').val().trim());}
			    },
			});
			//unit add dialog
			$('#uAddDialog').dialog({
			    autoOpen: false,
			    width: 300,
			    height: 160,
			    modal: true,
			    buttons: {"Add": function(){CA.actions.UnitAdd($(this).find('.uName').val().trim());}},
			});
			//unit delete dialog
			$('#uDelDialog').dialog({
			    autoOpen: false,
			    height: 230,
			    width: 300,
			    modal: true,
			    buttons: {
			      "Delete": function(){CA.actions.UnitDelete($(this).find('.confirm').val());}
			    },
			});
			//Window Control Ends
		},
		
		functionButtons : function(){
			//add hover class to the function buttons
			$( ".functions li" ).hover(function() {
				$( this ).addClass( "ui-state-hover" );
			},
				function() {
					$( this ).removeClass( "ui-state-hover" );
			});
		},
		
		units : function(e){
			var f = this;
			this.functionButtons();
			//assign actions
			//add
			e.find('#addUnit').click(function(){
				//clear the content
				$('#uAddDialog').find('.uName').val('');
				//open the dialog
				$('#uAddDialog').dialog('open');
			});
			//edit
			e.find('#editUnit').click(function(){
				var i = e.find('li.ui-selected').index();
				console.log('Editing unit no: ' + i);
				if(i != -1){
					//use this unit's name as default
					$('#uEditDialog .uName').val(f.wareH.courses[f.p.cIdx].units[i].name);
					//update the pointer
					f.p.uid = f.wareH.courses[f.p.cIdx].units[i].id;
					//open the dialog
					$('#uEditDialog').dialog('open');		
				}else{
					CA.view.infoMsg('Please select one unit first.');
				}
			});
			//delete
			e.find('#delUnit').click(function(){
				var i = e.find('li.ui-selected').index();
				console.log('Deleting unit no: ' + i);
				//empty the input
				$('#uDelDialog .confirm').val('');
				if(i != -1){
					//update the pointer
					CA.actions.pointer.uid = CA.wareHouse.courses[CA.actions.pointer.cIdx].units[i].id;
					//open the dialog
					$('#uDelDialog').dialog('open');
				}else{
					CA.view.infoMsg('Please select one unit first.');
				}
			});
		},

		activities : function(e){
			var f = this;
			this.functionButtons();
			//assign actions
			//delete
			e.find('.delAct').click(function(){
				var idx = e.find('#tabs'+f.p.rid).find('.aplate').find('li.ui-selected').index();
				if(idx != -1){
					//delete the activity
					CA.actions.UnitRemoveAct();
				}else{
					CA.view.infoMsg('Please select an activity first.');
				}
			});
		},
		
		resources : function(li){
			//bond the event
			//add part
			li.delegate('span.ui-icon-plus', 'click', function(){
				//where add part starts
				//clear the content
				$('#rAddDialog').find('.rName').val('');
				//open the dialog
				$('#rAddDialog').dialog('open');
			});
			//modify part
			li.delegate('span.ui-icon-pencil', 'click', function(){
				//where modify part starts
				//use this resource's name as default
				$('#rEditDialog .rName').val(li.children('a').text());
				//open the dialog
				$('#rEditDialog').dialog('open');
			});
			//delete part
			li.delegate('span.ui-icon-trash', 'click', function(){
				//wehre delete part starts
				//empty the input
				$('#rDelDialog .confirm').val('');
				//open the dialog
				$('#rDelDialog').dialog('open');
			});
		},

		rList : function(e){
			var f = this;
			this.functionButtons();
			//edit resource
			e.find('#editResource').click(function(){
				var i = e.find('li.ui-selected').index();
				console.log('Editing resource no: ' + i);
				if(i != -1){
					//use this resource's name as default
					$('#rEditDialog .rName').val(f.wareH.courses[f.p.cIdx].resources[i].name);
					//update the pointer
					f.p.rid = f.wareH.courses[f.p.cIdx].resources[i].id;
					//open the dialog
					$('#rEditDialog').dialog('open');		
				}else{
					CA.view.infoMsg('Please select one resource first.');
				}
			});
			//add resource
			e.find('#addResource').click(function(){
				$('#rAddDialog .rName').val('');
				//open the dialog
				$('#rAddDialog').dialog('open');
			});
			//delete
			e.find('#delResource').click(function(){
				var i = e.find('li.ui-selected').index();
				console.log('Deleting resource no: ' + i);
				//empty the input
				$('#rDelDialog .confirm').val('');
				if(i != -1){
					//update the pointer
					f.p.rid = f.wareH.courses[f.p.cIdx].resources[i].id;
					//open the dialog
					$('#rDelDialog').dialog('open');
				}else{
					CA.view.infoMsg('Please select one resource first.');
				}
			});
		},

		rProviders : function(e){
			var f = this;
			this.functionButtons();
			//delete
			e.find('#delProvider').click(function(){
				var i = e.find('li.ui-selected').index();
				console.log('Deleting provider no: ' + i);
				if(i != -1){
					var j = $('.rList').find('li.ui-selected').index();
					//update the pointer
					f.p.pid = f.wareH.courses[f.p.cIdx].resources[j].providerIds[i];
					//delete
					CA.actions.ResProvRemove();
				}else{
					CA.view.infoMsg('Please select one provider first.');
				}
			});
		},
};

