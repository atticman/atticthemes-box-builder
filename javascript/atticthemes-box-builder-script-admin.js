/* global console:false, jQuery:false, tinyMCEPreInit:false, wpActiveEditor:true, tinymce:false, quicktags:false, QTags:false, switchEditors:false, wp: false, alert: false */
/* jshint unused: vars */

/* find active/uncommented console logs [\t|\s](console\.log) */

//console.log( 'hello from the builder script' );
var atticthemes_box_builder;
var atbb_settings;

(function($) {
	'use strict';
	if( window.atticthemes_box_builder_json === undefined ) {
		return;
	}

	var builder_parent;

	var postdivrich = $('#postdivrich');

	var tabsholder = $('.atbb-editor-tabs');
	var button_container = $('.wp-editor-tabs');
	var wp_active_tab_class_carier = $('#wp-content-wrap');

		
	
	var content_editor_elements = $('#wp-content-editor-container, #content-resize-handle, #post-status-info');
	var publish_button = $('#publish');

	try {
		atbb_settings = JSON.parse(window.atticthemes_box_builder_json);
		var builder = $('#'+atbb_settings.id );
		if( builder.length === 0 ) {
			return;
		}
		builder_parent = builder.parent();
		builder.prependTo( builder_parent );
	} catch (e) {
		console.error( 'Parsing error:', e );
		return;
	}



	/* Add the switch button */
	var button = $('<button/>',{'type':'button','class': 'atbb-switch-builder'}).hide();
		button.text('Box Builder');
		button_container.prepend( button );
		

	atticthemes_box_builder = {
		widgets: {}
	};


	/**
	 * Capture the submit button that was clicked or pressed to subit the form
	 * Store it in the form data to be accessed from within the .on('submit') event handeler
	 */
	$('form').has( publish_button ).find('input[type="submit"]').on('click.boxbuilder keypress.boxbuilder', function(e, submit) {
		var button = $(this);
		var id = button.attr('id');
		var form = $('form').has(this);

		/**
		 * check if the click event is coming from within the form submit event handeler (programmatically)
		 * and not the user interaction
		 */
		if( submit ) {
			/**
			 * Store the intention to submit the form
			 */
			form.data( 'submit', true );
		}

		/**
		 * Store the button id user interacted with
		 */
		form.data( 'submitter', '#' + id );
	});


	//initiate box builder if it has not been initiated yet when user tries to publish/update the post.
	$('form').has( publish_button ).on('submit.boxbuilder', function(e, submit) {
		var oev = $.Event(e.originalEvent);
		var form = $(this);

		/**
		 * Check if builder is initiated, if not just return true, noting changed, thus nothing to save
		 */
		if( atticthemes_box_builder.builder === undefined ) return true;

		/**
		 * Find the submit button that caused form submition
		 */
		//var submitter_id = form.data( 'submitter' );
		//var submitter = form.find( submitter_id );

		console.log(oev.type, submit);

		/**
		 * Someone else is sending the original event and its type is not submit,
		 * so we are gonna return true not to break their functionality
		 */
		if( oev.type == undefined && submit == undefined ) {
			/**
			 * Output the data so the the "Preview Changes" button works properly
			 */
			atticthemes_box_builder.builder.output();
			return true;
		}

		/**
		 * we are sending the original event to submit after ajax is done
		 */
		if( oev.type == undefined && submit ) {
			console.log(window.onbeforeunload);

			//window.onbeforeunload = null;

			return true;
		}

		/**
		 * After this point it means the original event was "submit",
		 * so we will continue runing the script to save the data and resubmit the form
		 * --------------------
		 * oev.type => "submit"
		 */


		/**
		 * Call builder's "save" method to output and save the data than trigger form submission when ajax is done
		 * Sending second argument (submit) as [true] to let the logic know we are submiting the form programatically 
		 * from within the ajax complete function
		 */
		atticthemes_box_builder.builder.events.one('savelayouts', function(e, response) {
			console.log(response);
			//Wordpress's event: beforeunload.edit-post
			$(window).off( 'beforeunload' );

			form.trigger('submit.boxbuilder', [true]);

		});
		atticthemes_box_builder.builder.save();


		return false;
	});


	




	tabsholder.find('a, button').not('.atbb-switch-builder').on('click', function(e) {
		e.preventDefault();
		//content_editor_elements.show();
		var tab = $(this).attr('data-switch');
			

		builder.hide();
		postdivrich.show();

		switchEditors.go( 'content', tab );
		$(window).trigger('scroll');

		return false;
	});


	$('.atbb-switch-builder').on('click', function(e) {
		e.preventDefault();

		builder.show();
		postdivrich.hide();
		$(window).trigger('scroll');

		if( atticthemes_box_builder.builder === undefined ) {
			initBuilder();
		}

		return false;
	});



	window.BoxBuilderWidget = function( name, object ) {
		if( !name ) {
			console.error( 'A widget must have a name.' );
			return;
		}

		if( !object || !object instanceof Object ) {
			console.error( 'Second argument must be an object.' );
			return;
		}

		if( !isBoxBuilderWidgetDisabled(name) ) {
			atticthemes_box_builder.widgets[name] = object;
		}

		return object;
	}

	window.isBoxBuilderWidgetDisabled = function( widget ) {
		if( !atbb_settings.disabled_widgets ) return false;

		if( atbb_settings.disabled_widgets.indexOf(widget) < 0 ) {
			return false;
		} else {
			return true;
		}
	}

	function initBuilder( callback ) {
		atticthemes_box_builder.builder = new BoxBuilder( atbb_settings, atticthemes_box_builder.widgets );
		atticthemes_box_builder.builder.events.on('builder:ready', function() {
			//console.log( 'builder:ready' );
			if( callback ) {
				callback();
			}
		});
	}















	/* BoxBuilder Object */
	function BoxBuilder( settings, ext_widgets ) {
		var builder = this;
		var metabox = $('#'+ atbb_settings.id );
		var namespace = settings.namespace;

		builder.widgets = {};
		
		builder.namespace = namespace;
		builder.data = settings.data;
		builder.layouts_total = 0;
		builder.groups_total = 0;
		builder.content = $('.atbb-content', metabox);
		builder.controls = $('.atbb-controls', metabox);
		builder.widget_selector = new WidgetSelector();
		builder.has_DOM_updated = false;

		builder.events = metabox;

		//init the history manager
		builder.history = new HistoryManager();

		/**
		 * Exporter
		 */
		builder.exporter = new Exporter();

		/**
		 * Importer
		 */
		builder.importer = new Importer();

		builder.content_version_field = $('.atbb-content-version-field');

		//general controls
		var newLayoutButton = $('.atbb-add-layout', metabox);
		var saveLayoutButton = $('.atbb-save-layout', metabox);

		var redoButton = $('.atbb-redo');
		var undoButton = $('.atbb-undo');

		var importButton = $('.atbb-import', metabox);
		var exportButton = $('.atbb-export', metabox);

		function construct() {
			//extend the widgets
			$.extend(true, builder.widgets, ext_widgets );

			//apply sortable on content for layouts
			builder.content.sortable({
				items: '> .atbb-layout-group',
				handle: '.atbb-layout-group-header',
				tolerance: 'pointer',
				//axis: 'y',
				placeholder: 'atbb-layout-group-placeholder',
				start: function( event, ui ) {
					ui.placeholder.css({
						height: ui.helper.outerHeight()
					});
				},
				stop: function( event, ui ) {
					builder.onReorder();
					if( builder.has_DOM_updated ) {
						builder.has_DOM_updated = false;
						builder.history.add();
					}
				},
				update: function() {
					builder.onReorder();
					builder.has_DOM_updated = true;
				}
			});



			/**
			 * Loading / busy indicator
			 */
			builder.loading = $('<div/>', {
				id: 'atbb-loading'
			}).hide().appendTo( builder.content );

			$('<span/>', { 'class': 'atbb-clock-long-hand preloading-x2'}).appendTo( builder.loading );
			$('<span/>', { 'class': 'atbb-clock-short-hand preloading'}).appendTo( builder.loading );

			//$('<span/>').text( 'Loading' ).appendTo( builder.loading );





			//start building the layouts and the widgets
			builder.build( builder.data );


			//------------- user interactions -------------
			//add layout gruop
			newLayoutButton.on('click', function( e ) {
				e.preventDefault();

				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}

				new LayoutGroup();
				builder.onReorder();
				builder.history.add();
			});

			//------------save layouts---------------
			saveLayoutButton.on('click', function( e ) {
				e.preventDefault();
				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}
				//call the save method if the button is not disabled
				$(this).removeClass('fa-save').addClass('fa-clock-o atbb-disabled atbb-saving');
				builder.save();
			});

			builder.events.on('savelayouts', function( e, response ) {
				//console.log( response );
				if( response.status === 'success' ) {
					saveLayoutButton.removeClass('fa-clock-o atbb-disabled atbb-saving').addClass('fa-save');
				} else {
					saveLayoutButton.removeClass('fa-clock-o').addClass('fa-times');
					saveLayoutButton.attr({
						title: response.message
					});
					alert( response.message );
				}
				
			});
			//---------------------------------------

			builder.history.add();
			builder.history.onChange = function() {
				if( builder.history.now === 0 ) {
					$('.atbb-undo').addClass( 'atbb-disabled' );
				} else {
					$('.atbb-undo').removeClass( 'atbb-disabled' );
				}

				if( builder.history.now === builder.history.entries-1 ) {
					$('.atbb-redo').addClass( 'atbb-disabled' );
				} else {
					$('.atbb-redo').removeClass( 'atbb-disabled' );
				}
			};
			
			//----- user interactions -> history manager
			undoButton.on('click', function( e ) {
				e.preventDefault();
				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}
				//get the state object
				var history_data = builder.history.undo();
				if( history_data ) {
					//clear the content
					builder.clear();
					//build the layouts
					builder.build( history_data );
				}
			});
			
			redoButton.on('click', function( e ) {
				e.preventDefault();
				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}
				//get the state object
				var history_data = builder.history.redo();
				if( history_data ) {
					//clear the content
					builder.clear();
					//build the layouts
					builder.build( history_data );
				}
			});



			exportButton.on('click', function( e ) {
				e.preventDefault();

				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}

				builder.exporter.open();
			});

			importButton.on('click', function( e ) {
				e.preventDefault();

				//if disabled
				if( $(this).hasClass('atbb-disabled') ) {
					return false;
				}

				builder.importer.open();
			});


		} // END construct

		builder._import = function( data ) {
			var decoded = JSON.parse( decodeURIComponent( atob(data) ) );
			builder.clear();
			builder.build( decoded );

			return decoded;
		}

		builder._export = function() {
			var data = builder.get_sanitized_data();
			var encoded = btoa( encodeURIComponent(JSON.stringify(data)) );

			return encoded;
		}

		builder._import_data = function( data ) {
			builder.data = JSON.parse( decodeURIComponent( atob(data) ) );
			builder.clear();
			builder.build( builder.data );

			return builder.data;
		}

		builder._export_data = function( export_data ) {
			var data = export_data ? export_data : builder.data;
			var encoded = btoa( encodeURIComponent(JSON.stringify(data)) );

			return encoded;
		}


		builder.clear = function() {
			builder.content.children('.atbb-layout-group').remove();
			builder.layouts_total = 0;
			builder.groups_total = 0;
		};


		builder.build = function( __data__ ) {
			var the_data = __data__ ? __data__ : {};
			//console.log(the_data);

			var indexes = 0;

			builder.disable_toolbar();
			builder.loading.show();
			
			setTimeout( function() {

				/**
				 * Old version check for backward compatible 
				 */
				var group;

				if( the_data && the_data[0] && the_data[0].columns ) {
					group = new LayoutGroup( false, true );
				}

				$.each(the_data, function( l ) {

					var layout_group_data = the_data[indexes];
					
					/**
					 * Old version (pre Section times)
					 */
					if( layout_group_data && layout_group_data.columns ) {
						//if the structure data exists
						if( layout_group_data && (layout_group_data instanceof Object || layout_group_data instanceof Array) ) {
							/**
							 * in this case layout_group_data is the column data for the row/layout
							 */
							group.addLayout( layout_group_data );
							//builder.onReorder();
						}
					} else if( layout_group_data && layout_group_data.layouts ) {
						/**
						 * New version (post Section times)
						 */
						//if the structure data exists
						if( layout_group_data && (layout_group_data instanceof Object || layout_group_data instanceof Array) ) {
							new LayoutGroup( layout_group_data );
							//builder.onReorder();
						}
					}
					
					indexes++;
				});

				builder.loading.hide();
				setTimeout( function() {
					builder.enable_toolbar();
					builder.events.trigger( 'builder:ready' );
				}, 100 );
			}, 100 );
		};



		builder.disable_toolbar = function() {
			builder.controls.children().addClass( 'atbb-disabled' );
		}

		builder.enable_toolbar = function() {
			builder.controls.children().removeClass( 'atbb-disabled' );
		}



		/**
		 * Sanitize empty sections and return clean data for save
		 */
		builder.get_sanitized_data = function() {
			var _the_data = builder.content.formParams( true );
			var sections = _the_data[builder.namespace] ? _the_data[builder.namespace] : '';

			var layout_group;
			var new_group_data = {};
			var indexes = 0;

			var groups_to_destroy = [];

			if( sections !== '' ) {
				new_group_data = {};

				$.each(sections, function( i ) {
					//console.log(_groups[g].layouts);
					if( sections[i].layouts ) {
						new_group_data[indexes] = sections[i];
						indexes++;
					} else {
						layout_group = builder.content.children('.atbb-layout-group').eq(i).data( 'group' );
						//console.log( layout_group );
						if( layout_group ) {
							groups_to_destroy.push( layout_group );
						}
					}
				});

				$.each(groups_to_destroy, function( index, group ) {
					group.destroy();
				});
			}

			return new_group_data;
		}



		builder.save = function( forced_data ) {
			builder.onReorder();

			var sections = builder.get_sanitized_data();
			
			if( sections !== '' ) {
				sections.output = builder.output();
			} else {
				sections.output = builder.output();
			}

			sections['content-version'] = atbb_settings.version;

			$.ajax({
				type : 'post',
				dataType : 'json',
				url : settings.ajax_url,
				data : {
					action: 'atbb_save_layouts',
					nonce: settings.nonce.value,
					post_id: settings.post_id,
					data: forced_data ? forced_data: sections
				},
				success: function(response) {
					builder.events.trigger('savelayouts', [response]);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.warn( 'atbb:', jqXHR, textStatus, errorThrown );
				}
			});
			//console.log(settings);
		};

		

		//reset names of the fields on layout change or widget reorder, clone, etc...
		builder.onReorder = function() {
			//======= Layout Groups ===============================================
			builder.content.children('.atbb-layout-group').each(function( g ) {
				var _layout_group = $(this);

				var layouts = _layout_group.find('.atbb-layout');

				var layout_editor = _layout_group.find('.atbb-group-editor');
				var setting_fields = layout_editor.find('.atbb-builder-option .atbb-data-field');

				setting_fields.each(function() {
					var name = $(this).attr('name');
					var new_name = name.replace(
						/\[[0-9]+\]\[settings\]/,
						'[' + g + '][settings]'
					);
					$(this).attr('name', new_name);
				});

				//======= Layouts ===============================================
				layouts.each(function( l ) {
					var _layout = $(this);
					//======= Columns ===============================================
					var _columns = _layout.find('.atbb-layout-columns').children();
					_columns.each( function( c ) {
						var layout_structure_fields = $(this).find('.atbb-layout-structure-field');

						layout_structure_fields.each(function() {
							var name = $(this).attr('name');
							var new_name = name.replace(
								/\[[0-9]+\]\[layouts\]\[[0-9]+\]\[structure\]\[[0-9]+\]/,
								'[' + g + '][layouts][' + l + '][structure][' + c + ']'
							);
							$(this).attr('name', new_name);
						});

						
						//======= Widgets ===============================================
						var _widgets = $(this).find('.atbb-widgets').children();
						_widgets.each( function( w ) {
							
							var widget = $(this).data('Widget');
								widget.namespace = widget.namespace.replace(
									/\[[0-9]+\]\[layouts\]\[[0-9]+\]\[columns\]\[[0-9]+\]\[widgets\]\[[0-9]+\]/,
									'[' + g + '][layouts][' + l + '][columns][' + c + '][widgets][' + w + ']'
								);

							//console.log( widget );

							var widget_fields = $(this).find('.atbb-data-field');

							widget_fields.each(function() {
								var name = $(this).attr('name');
								var new_name = name.replace(
									/\[[0-9]+\]\[layouts\]\[[0-9]+\]\[columns\]\[[0-9]+\]\[widgets\]\[[0-9]+\]/,
									'[' + g + '][layouts][' + l + '][columns][' + c + '][widgets][' + w + ']'
								);
								$(this).attr('name', new_name);
							});
						}); //END each widget

					}); //END each column
				});//END each layout

			}); //END each layout group
		};











		//Creates a new LayoutGroup Object to group layouts inside
		function LayoutGroup( group_data, empty_group ) {
			var group = $('<div/>').addClass('atbb-layout-group');
				group.header = $('<div/>').addClass('atbb-layout-group-header').appendTo( group );
				group.content = $('<div/>').addClass('atbb-layout-group-content').appendTo( group );

				group.namespace = namespace + '['+ '9999'/*builder.groups_total*/ +'][settings]';


			group.toggler_btn = $('<span/>', {
				title: 'Click to toggle'
			}).addClass('atbb-group-toggle fa fa-chevron-down').appendTo( group.header );

			group.title = $('<span/>').addClass('atbb-group-title').appendTo( group.header );
			group.title.data('default-section-name', 'Section');
			group.title.text( group.title.data('default-section-name') );

			group.remover_btn = $('<span/>', {
				title: 'Remove Section'
			}).addClass('atbb-group-remove fa fa-times').appendTo( group.header );

			group.editor_btn = $('<span/>', {
				title: 'Section Settings'
			}).addClass('atbb-group-edit fa fa-cogs').appendTo( group.header );

			group.layout_adder_btn = $('<span/>', {
				title: 'Add Row'
			}).addClass('atbb-group-add-layout fa fa-plus').appendTo( group.header );


			group.destroy = function() {
				group.remove();
				builder.groups_total--;
				builder.onReorder();

				builder.history.add();
			};

			group.addLayout = function( layout_data ) {
				var layout = new Layout( layout_data ? false : true );
					if( layout_data ) {
						layout.set( layout_data );
					}
					layout.appendTo( group.content );

				builder.content.sortable( 'refresh' );
			};
			
			group.clear = function() {
				var _layouts = group.content.children('.atbb-layout');
				_layouts.each(function() {
					var _layout = $(this).data('object');
						_layout.destroy( true );
				});
			}










			/* Group Editor */
			group.toggle_state_option = undefined;
			group.settings_storage = undefined;

			var group_editor = $('<div/>', {'class': 'atbb-group-editor'}).appendTo( group );
			var editor_wrapper = $('<div/>', {'class': 'atbb-group-editor-wrapper'}).appendTo( group_editor );
			var editor_header = $('<div/>', {'class': 'atbb-group-editor-header'}).appendTo( editor_wrapper );
			var editor_content = $('<div/>', {'class': 'atbb-group-editor-content'}).appendTo( editor_wrapper );
			var editor_footer = $('<div/>', {'class': 'atbb-group-editor-footer'}).appendTo( editor_wrapper );

			group.editor = editor_content;

			group.editor.title = $('<div/>', {'class': 'atbb-group-editor-title'}).appendTo( editor_header );
			group.editor.title.text( 'Section Settings' );


			var editor_close = $('<span/>', {
				'class': 'atbb-group-editor-close fa fa-times',
				title: 'Cancel and close the editor'
			}).appendTo( editor_header );

			var editor_cancel = $('<span/>', {
				'class': 'atbb-group-editor-cancel',
				title: 'Cancel and close the editor'
			}).text('Cancel').appendTo( editor_footer );
			var editor_save = $('<span/>', {
				'class': 'atbb-group-editor-save',
				title: 'Save and close the editor'
			}).text('Save').appendTo( editor_footer );


			group.editor.getSettings = function() {
				var form_data = group.editor.formParams( true );
				var _layout_groups = form_data[builder.namespace] ? form_data[builder.namespace] : false;
				var _settings = {};
				if( _layout_groups ) {
					$.each(_layout_groups, function() {
						if( this.settings ) {
							_settings = this.settings;
						}
					});
				}
				return _settings;
			};

			group.editor.updateSettings = function( layout_settings ) {
				//delete all the data and events attached to the option elements
				group.editor.children().remove();
				group.buildEditorOptions( layout_settings );

				//console.log(layout_settings);
				group.editor.updateGroupName( layout_settings );
			};

			group.editor.open = function() {
				group_editor.show();
				group.settings_storage = group.editor.getSettings();
			};

			group.editor.close = function() {
				group.editor.updateSettings( group.settings_storage );
				group_editor.hide();
			};

			group.editor.save = function() {
				group.settings_storage = group.editor.getSettings();
				group_editor.hide();
				group.editor.updateGroupName( group.settings_storage );
			};

			group.editor.updateGroupName = function( settings ) {
				//console.log(settings);
				if( settings && settings.section_name ) {
					group.title.text( settings.section_name );
				} else {
					group.title.text( group.title.data('default-section-name') );
				}
			}


			group.buildEditorOptions = function( settings ) {
				//build group options
				group.settings = settings ? settings : {};

				$('<h2/>').text('Background Settings').appendTo( group.editor );
				$('<em/>').html('Here you will be able to set the background media for the section, change the media size, alignment and how it behaves.').appendTo( group.editor );
				$('<hr/>').appendTo( group.editor );

				new builder.Option({
					title: 'Background Media',
					description: 'Set a background media, like an image or a video.',
					type: 'media',
					name: '[bg_media]',
					value: group.settings.bg_media ? group.settings.bg_media : ''
				}, group.namespace).appendTo( group.editor );
				

				new builder.Option({
					title: 'Background Media Opacity',
					description: 'Set the opacity value of the background media. Where 0 is transparent and 1 is opaque.',
					type: 'number',
					name: '[media_opacity]',
					value: group.settings.media_opacity ? group.settings.media_opacity : 0.4,
					step: 0.1,
					min: 0,
					max: 1
				}, group.namespace).appendTo( group.editor );



				new builder.Option({
					title: 'Background Color',
					description: 'Set a background color for the section.',
					type: 'color',
					name: '[bg_color]',
					value: group.settings.bg_color ? group.settings.bg_color : ''
				}, group.namespace).appendTo( group.editor );

				new builder.Option({
					title: 'Text Color',
					description: 'Set the text color for the section.',
					type: 'color',
					name: '[text_color]',
					value: group.settings.text_color ? group.settings.text_color : ''
				}, group.namespace).appendTo( group.editor );



				new builder.Option({
					title: 'Background Image Alignment',
					description: 'Select the alignment fot the background image. Note: This option is used only if an image is selected.',
					type: 'select',
					name: '[image_alignment]',
					value: group.settings.image_alignment ? group.settings.image_alignment : 'center',
					options: {
						'left': 'Left',
						'center': 'Center',
						'right': 'Right'
					}
				}, group.namespace).appendTo( group.editor );

				new builder.Option({
					title: 'Background Image Size',
					description: 'Select whether the image should contain or cover the background. Note: This option is used only if an image is selected.',
					type: 'select',
					name: '[image_size]',
					value: group.settings.image_size ? group.settings.image_size : 'cover',
					options: {
						'auto': 'Auto',
						'cover': 'Cover',
						'contain': 'Contain'
					}
				}, group.namespace).appendTo( group.editor );

				new builder.Option({
					title: 'Background Type',
					description: 'Select the type of the background media.',
					type: 'select',
					name: '[background_type]',
					value: group.settings.background_type ? group.settings.background_type : 'normal',
					options: {
						'normal': 'Normal',
						/*'fixed': 'Fixed',*/
						'parallax': 'Parallax'
					}
				}, group.namespace).appendTo( group.editor );


				$('<h2/>').text('General Settings').appendTo( group.editor );
				$('<em/>').html('Here you can set the Section Width and additional css classes if you need to apply specific styling to the section.').appendTo( group.editor );
				$('<hr/>').appendTo( group.editor );

				new builder.Option({
					title: 'Section Width',
					description: 'Select which type of width you would like this section to have.',
					type: 'select',
					name: '[mode]',
					value: group.settings.mode ? group.settings.mode : 'normal',
					options: {
						'normal': 'Content Width',
						'full': 'Full Width'
					}
				}, group.namespace).appendTo( group.editor );

				new builder.Option({
					title: 'Row Width',
					description: 'Select which type of width you would like the rows inside this section to have.',
					type: 'select',
					name: '[row_mode]',
					value: group.settings.row_mode ? group.settings.row_mode : 'normal',
					options: {
						'normal': 'Content Width',
						'full': 'Full / Section Width'
					}
				}, group.namespace).appendTo( group.editor );

				$('<hr/>').appendTo( group.editor );

				new builder.Option({
					title: 'Section Name',
					description: 'This is just used in the admin area to help you easily identify sections.',
					type: 'text',
					name: '[section_name]',
					value: group.settings['section_name'] ? group.settings['section_name'] : '',
					placeholder: 'Example: Section of services'
				}, group.namespace).appendTo( group.editor );

				

				new builder.Option({
					title: 'Section ID',
					description: 'Set a section ID. You can use this id for anchor tags for example.',
					type: 'text',
					name: '[section_id]',
					value: group.settings['section_id'] ? group.settings['section_id'] : '',
					placeholder: 'Example: services-section'
				}, group.namespace).appendTo( group.editor );

				$('<hr/>').appendTo( group.editor );

				new builder.Option({
					title: 'Additional CSS Class',
					description: 'This applies the class-names set bellow to the section, allowing you to apply specific styling via CSS.',
					type: 'text',
					name: '[class]',
					value: group.settings['class'] ? group.settings['class'] : '',
					placeholder: 'Example: awesome-css-class'
				}, group.namespace).appendTo( group.editor );







				group.toggle_state_option = new builder.Option({
					type: 'hidden',
					name: '[toggle_state]',
					value: group.settings.toggle_state ? group.settings.toggle_state : false
				}, group.namespace).appendTo( group.editor );
			};


			//build the layout editor options
			if( group_data && group_data.settings && group.settings_storage === undefined ) {
				group.settings_storage = group_data.settings;
			}

			group.editor.updateSettings( group.settings_storage );


			if( group.settings_storage && group.settings_storage.toggle_state === 'closed' ) {
				group.addClass('atbb-closed-group');
			}






			group.toggle = function() {
				var group_settings = group.editor.getSettings();

				if( group.hasClass('atbb-closed-group') ) {
					group.removeClass('atbb-closed-group');
					group.toggle_state_option.find('input').val( 'open' );

					var all_group_widgets = group.find('.atbb-widget');
						all_group_widgets.each(function() {
							var data_widget = $(this).data('Widget');
							if( data_widget && data_widget.trigger ){
								data_widget.trigger('oncontent');
							}
						});
						//console.log(all_group_widgets);
				} else {
					group.addClass('atbb-closed-group');
					group.toggle_state_option.find('input').val( 'closed' );
				}
			}




			//user interactions
			group.editor_btn.on('click', function( e ) {
				e.preventDefault();
				group.editor.open();
			});

			editor_close.on('click', function( e ) {
				e.preventDefault();
				group.editor.close();
			});

			editor_cancel.on('click', function( e ) {
				e.preventDefault();
				group.editor.close();
			});

			editor_save.on('click', function( e ) {
				e.preventDefault();
				group.editor.save();
			});



			group.content.sortable({
				items: '> .atbb-layout',
				handle: '.atbb-layout-controls',
				connectWith: '.atbb-layout-group-content',
				tolerance: 'pointer',
				//axis: 'y',
				placeholder: 'atbb-layout-placeholder',
				start: function( event, ui ) {
					ui.placeholder.css({
						height: ui.helper.outerHeight()
					});
				},
				stop: function( event, ui ) {
					builder.onReorder();
					if( builder.has_DOM_updated ) {
						builder.has_DOM_updated = false;
						builder.history.add();
					}
				},
				update: function() {
					builder.onReorder();
					builder.has_DOM_updated = true;
				}
			});

			group.remover_btn.on('click', function( e ) {
				e.preventDefault();
				group.destroy();
			});

			group.layout_adder_btn.on('click', function( e ) {
				e.preventDefault();
				group.addLayout();
			});



			group.toggler_btn.on('click', function( e ) {
				e.preventDefault();
				group.toggle();
			});

			group.header.on('dblclick', function( e ) {
				e.preventDefault();
				group.toggle();
			});


			//add the layouts/rows in the group
			//console.log( group_data );
			if( group_data && group_data.layouts ) {
				$.each(group_data.layouts, function( g ) {
					group.addLayout( group_data.layouts[g] );
				});
			} else if( !empty_group ) {
				group.addLayout();
			}



			group.appendTo( builder.content );
			builder.content.sortable( 'refresh' );

			builder.groups_total++;

			builder.onReorder();

			group.data( 'group', group );

			return group;
		}












		//Creates a new Layout Object
		function Layout( set_default_layout ) {
			var layout = $('<div/>').addClass('atbb-layout');
				layout.remover_btn = $('<span/>').addClass('atbb-layout-remove fa fa-trash-o').appendTo( layout );
				layout.controls = $('<ul/>').addClass('atbb-layout-controls').appendTo( layout );
				layout.columns = $('<ul/>').addClass('atbb-layout-columns').appendTo( layout );
				layout.structure = undefined;
				
			//available layout types in an array
			var layouts = [
				{'class': 'atbb-layout-full-width', structure: ['full-width-column'], 'default': true},
				{'class': 'atbb-layout-one-halfs', structure: ['one-half-column', 'one-half-column']},
				{'class': 'atbb-layout-one-thirds', structure: ['one-third-column', 'one-third-column', 'one-third-column']},
				{'class': 'atbb-layout-one-fourths', structure: ['one-fourth-column', 'one-fourth-column', 'one-fourth-column', 'one-fourth-column']},
				{'class': 'atbb-layout-one-third-two-thirds', structure: ['one-third-column', 'two-thirds-column']},
				{'class': 'atbb-layout-two-thirds-one-third', structure: ['two-thirds-column', 'one-third-column']},
				{'class': 'atbb-layout-one-fourth-one-half-one-fourth', structure: ['one-fourth-column', 'one-half-column', 'one-fourth-column']},

				{'class': 'atbb-layout-one-fourth-one-fourth-one-half', structure: ['one-fourth-column', 'one-fourth-column', 'one-half-column']},
				{'class': 'atbb-layout-one-half-one-fourth-one-fourth', structure: ['one-half-column', 'one-fourth-column', 'one-fourth-column']},

				{'class': 'atbb-layout-three-fourths-one-fourth', structure: ['three-fourths-column', 'one-fourth-column']},
				{'class': 'atbb-layout-one-fourth-three-fourths', structure: ['one-fourth-column', 'three-fourths-column']}
			];


			/* layout editor */
			/**/





			
			layout.set = function( data, index ) {
				layout.storage = [];
				layout.namespace = namespace + '[9999][layouts][9999]';

				//console.log('set layout');
				//store the columns/widgets state
				layout.columns.children().each(function( c ) {
					layout.storage[c] = [];
					var _column = $(this);
					_column.find('.atbb-widgets').children().each(function( w ) {
						var widget = $(this).data('Widget');
						var clone = $(this).clone();
						layout.storage[c].push( clone.data('Widget', widget) );
					});
				});

				//empty the columns using the .remove() method to unbound the events and
				//delete all the data attached to the elements
				layout.columns.children().remove();


				//build columns and the hidden input fields
				//console.log(data.structure);
				if( data.structure ) {
					$.each(data.structure, function( s ) {
						var column = $('<li/>', { 'class': data.structure[s] }).appendTo( layout.columns );
						var widgets_container = $('<ul/>').addClass('atbb-widgets').appendTo( column );
						var add_widget = $('<span/>', {
							title: 'Add a widget'
						}).addClass('atbb-add-widget').appendTo( column );

						var structure_field = $('<input/>', {
							type: 'hidden',
							name: layout.namespace + '[structure]['+s+']',
							value: data.structure[s],
							'class': 'atbb-layout-structure-field atbb-data-field'
						});
						structure_field.appendTo( column );

						column.data({
							namespace: layout.namespace  + '[columns]['+s+']',
							widgets_total: 0
						});

						//------------------------------------------------------
						//------- generate the widgets using the data ----------
						if( data.columns && data.columns[s] && data.columns[s].widgets ) {
							//console.log( data.columns[s].widgets );
							var widgets = data.columns[s].widgets;
							$.each(widgets, function( w ) {
								var widget_data = widgets[w];
								var widget_template_name = widget_data['widget-template'];
								var widget = new Widget( widget_template_name, column );

								if( widget && widget.appendTo ) {
									widget.appendTo( widgets_container );
									builder.onReorder();
									widget.updateSettings( widget_data );
								}
							});
						}

						//add click event on add_widget button to open the Widget Selector
						add_widget.on('click', function( e ) {
							e.preventDefault();
							builder.widget_selector.open();
							builder.widget_selector.onSelect = function( template_name ) {
								var widget = new Widget( template_name, column );
								if( widget && widget.appendTo ) {
									widget.appendTo( widgets_container );
									builder.onReorder();
									builder.widget_selector.close();
									widget.updateSettings();
									if( widget.template.editing !== false ) {
										widget.remove_on_editor_cancel = true;
										widget.Edit();
									}
								}
							};
						});

						//apply sortable on widgets_container for widgets
						widgets_container.sortable({
							items: '> li',
							handle: '.atbb-widget-header',
							connectWith: '.atbb-widgets',
							tolerance: 'pointer',
							//axis: 'y',
							placeholder: 'atbb-widget-placeholder',
							start: function( event, ui ) {
								ui.placeholder.css({
									height: ui.helper.outerHeight()
								});
							},
							stop: function( event, ui ) {
								builder.onReorder();
								if( builder.has_DOM_updated ) {
									builder.has_DOM_updated = false;
									builder.history.add();
								}
							},
							update: function() {
								builder.onReorder();
								builder.has_DOM_updated = true;
							}
						});
					}); //END each structure
				}

				//recreate widgets from storage
				if( layout.storage ) {
					$.each(layout.storage,  function( sc ) {
						var storage_columns = layout.storage[sc];
						if( storage_columns ) {
							$.each(storage_columns, function( sw ) {
								var storage_widget = storage_columns[sw].data('Widget');
								var _columns = layout.columns.children();
								var widget_template_name = storage_widget.template.name;

								//sort out if there are left out widgets if the new layout has less columns
								//and append them to the last column
								var to_column = _columns.eq( sc );
								if( _columns.eq( sc ).length > 0 ) {
									to_column = _columns.eq( sc );
								} else {
									to_column = _columns.eq( _columns.length - 1 );
								}

								//build a new widget
								var widget = new Widget( widget_template_name, to_column );
								if( widget && widget.appendTo ) {
									var _widgets_container = to_column.find('.atbb-widgets');
										widget.appendTo( _widgets_container );
										builder.onReorder();
									//get the settings from the stored one
									var _settings = storage_widget.getSettings();
									//update new widget's settings with the stored one
									widget.updateSettings( _settings );
								}
							});
						}
					});
				}

				//assign the active layout class to the layout selector button
				if( layouts && data.structure ) {
					$.each(layouts, function( l ) {
						var compare = [];
						//convert the fromParams returned object into array to be able to compare
						$.each(data.structure, function( s ) {
							compare.push( data.structure[s] );
						});

						if( arraysEqual( layouts[l].structure, compare ) ) {
							layout.controls.children().removeClass( 'atbb-active-layout' ).filter( '.' + layouts[l]['class'] ).addClass( 'atbb-active-layout' );
						}
					});
				}

				builder.onReorder();
			}; // END .set method



			layout.destroy = function( no_history ) {
				layout.remove();
				builder.layouts_total--;
				builder.onReorder();

				if( !no_history ) {
					builder.history.add();
				}
			};

			//build the layout structure control buttons
			$.each(layouts, function( l ) {
				var button = $('<li/>', { 'class': layouts[l]['class'] }).data( 'structure', layouts[l].structure );
				button.appendTo( layout.controls );

				button.on('click', function( e ) {
					e.preventDefault();
					layout.set( layouts[l] );
					builder.history.add();
				});

				if( set_default_layout && layouts[l]['default'] ) {
					layout.set( layouts[l] );
				}
			});

			//remove the layout user interaction
			layout.remover_btn.on('click', function( e ) {
				e.preventDefault();
				layout.destroy();
			});




			//store the [Layout Object] in the data of the Element
			layout.data('object', layout);

			//append the built layout to the content
			//layout.appendTo( builder.content );
			//builder.content.sortable( 'refresh' );

			//incriment the total number of layouts
			builder.layouts_total++;
			builder.onReorder();

			return layout;
		}






































		function Widget( template_name, column ) {
			var template;

			if( builder.widgets[template_name] ) {
				template = builder.widgets[template_name];
			}

			if( !template || !column ) {
				return false;
			}

			var widget = $('<li/>', {'class': 'atbb-widget'});
				template.name = template_name;

				widget.template = template;
				widget.output = template.output;

			var header = $('<div/>', {'class': 'atbb-widget-header'}).appendTo( widget );
			var title = $('<div/>', {'class': 'atbb-widget-title'}).appendTo( header );
				title.text( template.title );

			var controls = $('<div/>', {'class': 'atbb-widget-controls'}).appendTo( header );
			var clone = $('<span/>', {'class': 'atbb-widget-clone fa fa-files-o'}).appendTo( controls );
			var edit = $('<span/>', {'class': 'atbb-widget-edit fa fa-pencil'}).appendTo( controls );
			var remove = $('<span/>', {'class': 'atbb-widget-remove fa fa-times'}).appendTo( controls );

			widget.content = $('<div/>', {'class': 'atbb-widget-content'}).appendTo( widget );

			var editor = $('<div/>', {'class': 'atbb-widget-editor'}).appendTo( widget );
			var editor_wrapper = $('<div/>', {'class': 'atbb-widget-editor-wrapper'}).appendTo( editor );
			var editor_header = $('<div/>', {'class': 'atbb-widget-editor-header'}).appendTo( editor_wrapper );

			var editor_content = $('<div/>', {'class': 'atbb-widget-editor-content'}).appendTo( editor_wrapper );

			var editor_footer = $('<div/>', {'class': 'atbb-widget-editor-footer'}).appendTo( editor_wrapper );

			widget.remove_on_editor_cancel = false;
			widget.editor = editor_content;
			widget.settings = {};
			widget.storage = {};

			if( template.editing === false ) {
				edit.hide();
			}

			if( template.cloning === false ) {
				clone.hide();
			}

			widget.editor.title = $('<div/>', {'class': 'atbb-widget-editor-title'}).appendTo( editor_header );
			var editor_close = $('<span/>', {
				'class': 'atbb-widget-editor-close fa fa-times',
				title: 'Cancel and close the editor'
			}).appendTo( editor_header );

			var editor_cancel = $('<span/>', {
				'class': 'atbb-widget-editor-cancel',
				title: 'Cancel and close the editor'
			}).text('Cancel').appendTo( editor_footer );
			var editor_save = $('<span/>', {
				'class': 'atbb-widget-editor-save',
				title: 'Save and close the editor'
			}).text('Save').appendTo( editor_footer );

			$('<span/>', {'class': 'atbb-widget-editor-header-separator'}).appendTo( editor_header );

			//get widgets in the column to set the namespace fr the widget
			widget.namespace = column.data('namespace') + '[widgets]['+ column.data('widgets_total') +']';
			widget.num = column.data('widgets_total');

			//a helper method to easily get name attribute values to set to inputs, textareas, etc...
			widget.nameinput = function( name ) {
				if( name ) {
					return widget.namespace + '['+ name +']';
				} else {
					return undefined;
				}
			};

			widget.setContent = function( content ) {
				widget.content.html( content );
				widget.content.show();

				setTimeout(function(){ 
					widget.trigger('oncontent');
				}, 0);
				//console.log('oncontent');
			};







			//widget template input
			var widget_input = $('<input/>', {
				'class': 'atbb-widget-input atbb-data-field',
				type: 'hidden',
				name: widget.nameinput('widget-template'),
				value: template.name
			});
			widget_input.appendTo( widget );


			//Update widget editor settings values
			widget.updateSettings = function( widget_data ) {
				//console.log( widget_data );

				editor_content.children().remove();
				editor_header.children('.atbb-header-control').remove();
				widget.settings = widget_data ? widget_data : {};
				if( typeof template.editor === 'function' ) {
					template.editor( widget );
				}
				widget.trigger('onupdate');
				widget.trigger('onsave');
			};

			//Get widget editor settings values
			widget.getSettings = function() {
				var _data = [];
				var _the_data = widget.editor.formParams( true );
				var _layout_groups = _the_data[builder.namespace];

				if( _layout_groups ) {
					$.each(_layout_groups, function() {
						var _layouts = this.layouts;
						if( _layouts ) { //------
							$.each(_layouts, function() {
								if( this.columns ) {
									var _columns = this.columns;
									$.each(_columns, function() {
										if( this.widgets ) {
											var _widgets = this.widgets;
											$.each(_widgets, function() {
												_data = this;
											});
										}
									});
								}
							});
						} //------

					});
				}

				//console.log( _data );
				return _data;
			};

			//get single value and return it
			//if value is not defined return the default
			widget.getOption = function( option, _default ) {
				if( widget.settings[option] === undefined ) {
					return _default;
				} else {
					return widget.settings[option];
				}
			};

			//Widget Controls
			widget.Clone = function() {
				var new_widget = new Widget( template.name, column );
				if( new_widget && new_widget instanceof jQuery ) {
					widget.after( new_widget );
					
					builder.onReorder();

					var _settings = widget.getSettings();
					new_widget.updateSettings( _settings );
					builder.history.add();
				}
			};

			widget.Edit = function() {
				widget.editor.Open();
			};

			widget.Remove = function() {
				widget.remove();
				builder.onReorder();
			};

			//user interactions
			//on remove click
			remove.on('click', function( e ) {
				e.preventDefault();
				widget.Remove();
				builder.history.add();
			});
			//on clone click
			clone.on('click', function( e ) {
				e.preventDefault();
				widget.Clone();
			});
			//on edit click
			edit.on('click', function( e ) {
				e.preventDefault();
				widget.Edit();
			});






			//HeaderControl method
			widget.editor.HeaderControl = function( classes ) {
				var button = $('<span/>', {'class': classes ? classes : ''}).addClass('atbb-header-control').appendTo( editor_header );

				button.setLabel = function( value ) {
					button.children('span').remove();
					var label = $('<span/>').appendTo( button );
					label.text( value );
				};

				return button;
			};






			//Option method
			widget.Option = function( option_settings ) {
				return new builder.Option( option_settings, widget.namespace );
			};// END Option



			//SortableContainer method
			widget.SortableContainer = function( namespace ) {
				if( !namespace ) return false;

				var container = $('<ul/>', {'class': 'atbb-widget-options-group-container'});
					container.groups_total = 0;
					container.namespace = namespace;
					container.bracketless_namespace = namespace.replace(/\[/, '').replace(/\]/, '');

				//addOption method
				container.addGroup = function() {
					container.groups_total = container.children().length;
					var group = $('<li/>', {'class': 'atbb-widget-options-group'});
					var header = $('<div/>', {'class': 'atbb-widget-options-group-header'}).appendTo( group );
					var edit_group = $('<span/>', {'class': 'atbb-widget-options-group-edit fa fa-chevron-right'}).appendTo( header );
					group.title = $('<div/>', {'class': 'atbb-widget-options-group-header-title'}).appendTo( header );
					var controls = $('<div/>', {'class': 'atbb-widget-options-group-controls'}).appendTo( header );

					group.open = false;

					var clone_group = $('<span/>', {
						'class': 'atbb-widget-options-group-clone fa fa-files-o',
						title: 'Clone'
					}).hide().appendTo( controls );
					var remove_group = $('<span/>', {
						'class': 'atbb-widget-options-group-remove fa fa-times',
						title: 'Remove'
					}).appendTo( controls );
					group.content = $('<div/>', {'class': 'atbb-widget-options-group-content'}).appendTo( group );
					group.options = [];

					group.addOption = function( option_settings ) {
						var new_name = container.namespace +'['+ container.groups_total +']' + option_settings.name;
						var new_option_settings = $.extend(true, {}, option_settings);
							new_option_settings.name = new_name;

						var option = new widget.Option( new_option_settings );
						//console.log( option );

						if( option && option.appendTo ) {
							option.appendTo( group.content );
							group.options.push( option_settings );
							//
							option.on('input', '.atbb-data-field', function() {
								var value = $(this).val();
								option.trigger( 'fieldchange', [value] );
								widget.trigger('onupdate');
							});
						}

						return option;
					};

					group.getValues = function() {
						var values = [];
						var widget_sett = widget.getSettings();
						var container_settings = widget_sett[container.bracketless_namespace];
						var index = group.index();

						values = container_settings[ index ];
						return values;
					};

					group.toggle = function( force_state ) {
						var state = 'closed';

						if( force_state === 'close' ) {
							group.removeClass('atbb-options-group-open');
						} else if( force_state === 'open' ) {
							group.removeClass('atbb-options-group-open');
							group.addClass('atbb-options-group-open');
						} else {
							group.toggleClass('atbb-options-group-open');
						}

						if( group.hasClass('atbb-options-group-open') ) {
							group.find('.atbb-builder-option').find('textarea').each(function(){
								$(this).buildMCEEditor();
							});

							state = 'open';
							group.open = true;
						} else {
							group.find('.atbb-builder-option').find('textarea').each(function() {
								$(this).destroyMCEEditor();
							});

							state = 'closed';
							group.open = false;
						}

						group.trigger( 'grouptoggle', [state] );
					};

					//on edit
					edit_group.on('click', function( e ) {
						e.preventDefault();
						group.toggle();
					});

					header.on('dblclick', function( e ) {
						e.preventDefault();
						group.toggle();
					});

					//on remove
					remove_group.on('click', function( e ) {
						e.preventDefault();
						group.Remove();
					});

					group.Remove = function() {
						group.remove();
						container.refresh();
						//console.log('removed a group');
					};

					//on clone
					group.onClone = function( clonner_callback ) {
						if( typeof(clonner_callback) === 'function' ) {
							clone_group.show();
							clone_group.on('click', function( e ) {
								e.preventDefault();

								var clone;
								if( group.open ) {
									group.toggle( 'close' );
									clone = clonner_callback( group.getValues() );
									group.toggle( 'open' );
								} else {
									clone = clonner_callback( group.getValues() );
								}

								group.after( clone );
								//container.refresh();
							});
						}
					};

					//container.groups_total++;
					
					group.appendTo( container );
					
					group.data( 'group', group );
					container.refresh();
					return group;
				};

				//onSort/refresh
				container.refresh = function() {
					var groups = container.children('.atbb-widget-options-group');
					groups.each(function( g ) {
						var fields = $(this).find('.atbb-data-field');
						fields.each(function() {
							var name = $(this).attr('name');
							var mod_namespace = container.namespace.replace(/\[/, '\\[').replace(/\]/, '\\]');
							var pattern = new RegExp( mod_namespace + '\\[[0-9]+\\]' );
							var replace = container.namespace +'[' + g + ']';
							var new_name = name.replace( pattern, replace );
							//console.log( new_name, g );
							$(this).attr('name', new_name);
						});
					});
					//
					triggerUpdate();
				};

				//apply sortable on groups container
				container.sortable({
					items: '> li.atbb-widget-options-group',
					handle: '.atbb-widget-options-group-header, .atbb-widget-options-group-handle',
					tolerance: 'pointer',
					//axis: 'y',
					placeholder: 'atbb-widget-options-group-placeholder',
					start: function( event, ui ) {
						ui.placeholder.css({
							height: ui.helper.height(),
							width: ui.helper.width(),
						});
					},
					stop: function( event, ui ) {
						container.refresh();
					}
				});

				function triggerUpdate() {
					setTimeout(function() {
						widget.trigger('onupdate');
					}, 0);
				}

				container.getGroups = function() {
					var groups_array = [];
					container.children('li.atbb-widget-options-group').each(function() {
						groups_array.push( $(this).data('group') );
					});
					return groups_array;
				};

				container.data('container', container);
				return container;
			};// END SortableContainer








			//-----------------------------Widget Editor------------------------------
			widget.editor.Open = function() {
				widget.storage = widget.getSettings();
				editor.find('.atbb-builder-option').not('.atbb-widget-options-group .atbb-builder-option')
				.find('textarea').each(function() {
					$(this).buildMCEEditor();
				});
				editor.show();
			};

			widget.editor.Close = function() {
				editor.hide();
				editor.find('.atbb-builder-option').find('textarea').each(function(){
					$(this).destroyMCEEditor();
				});

				$('.atbb-widget-options-group').each(function(){
					var group = $(this).data('group');
					if( group && group.toggle ) {
						group.toggle('close');
					}
				});

				widget.updateSettings( widget.storage );

				if( widget.remove_on_editor_cancel ) {
					widget.Remove();
					widget.remove_on_editor_cancel = false;
				}
			};

			widget.editor.Save = function() {
				editor.hide();
				editor.find('.atbb-builder-option').find('textarea').each(function(){
					//console.log( $(this).val() );
					$(this).destroyMCEEditor();
				});

				$('.atbb-widget-options-group').each(function(){
					var group = $(this).data('group');
					if( group && group.toggle ) {
						group.toggle('close');
					}
				});

				widget.remove_on_editor_cancel = false;
				widget.trigger('onsave');

				builder.history.add();
			};

			//user interactions
			editor_close.on('click', function( e ) {
				e.preventDefault();
				widget.editor.Close();
			});
			editor_cancel.on('click', function( e ) {
				e.preventDefault();
				widget.editor.Close();
			});

			//user interactions
			editor_save.on('click', function( e ) {
				e.preventDefault();
				widget.editor.Save();
			});

			//run template's editor method
			/*var editor_form = */ //template.editor( widget );
			/*if( editor_form && editor_form instanceof jQuery ) {
				editor_form.children().appendTo( editor_content );
			}*/

			column.data( 'widgets_total', parseInt(column.data('widgets_total'), 10) + 1 );
			//store the Widget object in the element's data
			widget.data( 'Widget', widget );
			return widget;
		}


















		builder.output = function() {
			var _data = [];
			var output = '';
			//var _the_data = builder.content.formParams( true );
			var _layout_groups = builder.get_sanitized_data();

			//console.log(_layout_groups);
			
			if( !$.isEmptyObject(_layout_groups) ) {
				output += '<div class="atticthemes-box-builder-content">';



				$.each(_layout_groups, function( g ) {
					var _layouts = this.layouts;
					var settings = this.settings;

					//console.log(settings);

					var section_id = '';
					var section_classes = ['atbb-section'];
					var section_styles = [];
					var media_cont_classes = ['section-background-media-container'];
					var media_url = '';
					var media_container = '';
					var media_opacity = 1;
					var mime = '';

					/*var media_width = '';
					var media_height = '';*/

					if( settings ) {
						if( settings.bg_media && settings.bg_media.url ) {
							media_url = settings.bg_media.url;

							/*if( settings.bg_media.width ) {
								media_width = settings.bg_media.width;
							}

							if( settings.bg_media.height ) {
								media_height = settings.bg_media.height;
							}*/

							if( settings.image_alignment ) {
								media_cont_classes.push('section-media-align-'+settings.image_alignment);
							}

							if( settings.image_size ) {
								media_cont_classes.push('section-media-size-'+settings.image_size);
							}

							if( settings.background_type ) {
								media_cont_classes.push('section-media-background-type-'+settings.background_type);
							}

							if( settings.bg_media.mime ) {
								mime = settings.bg_media.mime;
							}


							section_classes.push('section-background');
							if( settings.bg_media.type ) {
								section_classes.push('section-background-'+settings.bg_media.type);
							}

							if( settings.media_opacity ) {
								media_opacity = settings['media_opacity'];
							}

							media_container = '<div data-opacity="'+media_opacity+'" data-type="'+settings.bg_media.type+'" data-src="'+media_url+'" data-mime="'+mime+'" class="'+media_cont_classes.join(' ')+'"></div>';
						}

						if( settings.mode ) {
							section_classes.push('section-'+settings.mode+'-width');
						}

						if( settings['bg_color'] && settings['bg_color'] !== '' ) {
							section_classes.push('section-background');
							
							section_styles.push( 'background-color:'+settings['bg_color']+';' );

							var rgb = hex2rgb( settings['bg_color'] );
							var o = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
							if( o > 175 ) {
								section_classes.push( 'section-background-light' );
							} else {
								section_classes.push( 'section-background-dark' );
							}

							//console.log(o);
						}

						if( settings['text_color'] && settings['text_color'] !== '' ) {
							section_styles.push( 'color:' + settings['text_color']+';' );
						}

						if( settings.row_mode ) {
							section_classes.push( 'section-rows-'+settings.row_mode );
						}

						if( settings['class'] ) {
							section_classes.push(settings['class']);
						}

						if( settings.section_id ) {
							section_id = 'id="'+ settings.section_id +'"';
						}
						
					}

					section_classes = arrayUnique( section_classes );
					output += '<div '+ section_id +' style="'+section_styles.join(' ')+'" class="'+section_classes.join(' ')+'">';


					//console.log( _layouts );
					if( _layouts ) {

						$.each(_layouts, function( l ) {
							output += '<div class="atbb-row">';

							if( this.columns ) {
								var _structure = this.structure;
								var _columns = this.columns;
								$.each(_structure, function( s ) {
									//console.log( parseInt(s, 10), objectLength( _structure ) - 1 );

									var last = parseInt(s, 10) == ( objectLength( _structure ) - 1 ) ? 'last' : '';
									output += '<div class="block '+ this + ' ' + last +'">';

									if( _columns[s] !== undefined && _columns[s].widgets ) {
										var _widgets = _columns[s].widgets;
										$.each(_widgets, function( w ) {
											_data = this;
											var section_element = builder.content.children('.atbb-layout-group').eq( g );
											var layout_element = section_element.find('.atbb-layout').eq( l );
											var column_element = layout_element.find('.atbb-layout-columns').children('li').eq( s );
											var widget_element = column_element.find('.atbb-widgets').children('li').eq( w );
											var widget = widget_element.data('Widget');
											//console.log( widget );
											if( widget && typeof widget.output === 'function' ) {
												output += widget.output( widget, settings ).trim();
											}
										});
									}
									output += '</div>';
								});
							}
							output += '</div>'; //output closing of ROW
						});
					} // if _layouts

					output += media_container;
					output += '</div>'; //output closing of SECTIONS / GROUPS
				}); //END each layout groups / sections
				output += '</div>';
			}



			if( window.tinymce && !tinymce.get('content') ) {
				activate_default_visual_editor();
			}
			
			if( window.tinymce && typeof tinymce.get === 'function' && tinymce.get('content') instanceof tinymce.Editor ) {
				activate_default_visual_editor();

				var editor = tinymce.get('content');
				var content = $('<div/>').html( editor.getContent({format : 'raw'}) );

				//console.log( _layout_groups, content.find('.atticthemes-box-builder-content') );

				if( !$.isEmptyObject(_layout_groups) || content.find('.atticthemes-box-builder-content').length > 0 ) {
					editor.setContent( output, {format: 'raw'} );
					//console.log( editor );
					editor.save();
				}
			} else {
				//console.log('blah');
				$('textarea#content').val( output );
			}


			if( builder.content_version_field instanceof jQuery && builder.content_version_field.length > 0 ) {
				builder.content_version_field.val( atbb_settings.version );
			}

			//console.log( builder.content_version_field.val() );
			return output;
		};



		function activate_default_visual_editor() {
			if( switchEditors && switchEditors.go ) {
				switchEditors.go( 'content', 'tmce' );
				if( $('.atbb-switch-builder').hasClass('atbb-switch-builder-active') ) {
					/**
					 * Uncomment th eline bellow to switch to BoxBuilder tab when page is published or updated
					 */
					//$('.atbb-switch-builder').trigger('click');
				}
			}
		}
















		function HistoryManager() {
			var manager = this;
				manager.limit = 0;
				manager.history = [];
				manager.now = 0;
				manager.entries = 0;
				manager.onChange = function(){};

			manager.add = function( _state ) {
				if( manager.history.length < manager.limit || manager.limit === 0 ) {
					var state;
					if( _state !== undefined ) {
						state = _state;
					} else {
						//var from_data = builder.content.formParams( true );
						state = builder.get_sanitized_data();
					}

					//if( state instanceof Object ) {
						var entry = $.extend( true, {}, state );
						if( entry.output !== undefined ) {
							delete entry.output;
						}

						manager.history.splice( manager.now + 1, Number.MAX_VALUE, entry );
						//manager.history.push( entry );
						manager.now = manager.history.length - 1;
						manager.entries = manager.history.length;

						manager.onChange();
					//}
				}
			};

			manager.undo = function() {
				if( manager.now > 0 ) {
					var entry = {};
					var index = manager.now--;
					if( manager.history[ index ] ) {
						entry = manager.history[ manager.now ];
						manager.onChange();
						return entry;
					} else {
						return false;
					}
				}
			};

			manager.redo = function() {
				if( manager.now < manager.entries ) {
					var entry = {};
					var index = manager.now++;
					if( manager.history[ index] ) {
						entry = manager.history[ manager.now ];
						manager.onChange();
						return entry;
					} else {
						return false;
					}
				}
			};

			return manager;
		}


























		function WidgetSelector() {
			var selector = $('.atbb-widget-selector');
			var widgets = $('.atbb-widget-selector-widget-list', selector);
			var closer = $('.atbb-widget-selector-close', selector);

			selector.open = function() {
				$.each(builder.widgets, function( w ) {
					if( !builder.widgets[w].title || !builder.widgets[w]['class'] || !builder.widgets[w].output ) return;

					var widget = $('<li/>', {
						'class': 'atbb-widget-selector-' + builder.widgets[w]['class'],
						title: builder.widgets[w].title
					}).appendTo( widgets );

					//on widget click
					widget.on('click', function( e ) {
						selector.onSelect( w );
					});
				});
				selector.show();
			};

			selector.close = function() {
				selector.hide();
				//remove all widgets from the list
				widgets.children().remove();
			};

			//on select callback
			selector.onSelect = function( widget ) {};

			//user interactions
			closer.on('click', function( e ) {
				e.preventDefault();
				selector.close();
			});

			return selector;
		}










		function IconSelector() {
			var existing_icon_selector_element = $('.atbb-extension-container > .atbb-icon-selector');
			if( existing_icon_selector_element.length > 0 ) {
				return existing_icon_selector_element.data('icon_selector');
			}

			var icon_selector = $('<div/>', {'class': 'atbb-icon-selector'});
			var icon_selector_wrapper = $('<div/>', {'class': 'atbb-icon-selector-wrapper'}).appendTo(icon_selector);
			var icon_selector_header = $('<div/>', {'class': 'atbb-icon-selector-header'}).appendTo(icon_selector_wrapper);
				$('<span/>', {'class': 'atbb-icon-selector-title'}).appendTo(icon_selector_header);
				icon_selector.closer = $('<span/>', {'class': 'atbb-icon-selector-close fa fa-times'}).appendTo(icon_selector_header);

			var icon_selector_content = $('<div/>', {'class': 'atbb-icon-selector-content'}).appendTo(icon_selector_wrapper);
			icon_selector.list = $('<ul/>', {'class': 'atbb-services-icons-list'}).appendTo( icon_selector_content );

			//character table for FontAwesome version 4.0.3 (368 gliphs, 2 were blank so have been removed)
			var char_table = ['f042', 'f170', 'f037', 'f039', 'f036', 'f038', 'f0f9', 'f13d', 'f17b', 'f209', 'f103', 'f100', 'f101', 'f102', 'f107', 'f104', 'f105', 'f106', 'f179', 'f187', 'f1fe', 'f0ab', 'f0a8', 'f01a', 'f190', 'f18e', 'f01b', 'f0a9', 'f0aa', 'f063', 'f060', 'f061', 'f062', 'f047', 'f0b2', 'f07e', 'f07d', 'f069', 'f1fa', 'f1b9', 'f04a', 'f05e', 'f19c', 'f080', 'f02a', 'f0c9', 'f236', 'f0fc', 'f1b4', 'f1b5', 'f0f3', 'f0a2', 'f1f6', 'f1f7', 'f206', 'f1e5', 'f1fd', 'f171', 'f172', 'f15a', 'f032', 'f0e7', 'f1e2', 'f02d', 'f02e', 'f097', 'f0b1', 'f188', 'f1ad', 'f0f7', 'f0a1', 'f140', 'f207', 'f20d', 'f1ba', 'f1ec', 'f073', 'f133', 'f030', 'f083', 'f0d7', 'f0d9', 'f0da', 'f150', 'f191', 'f152', 'f151', 'f0d8', 'f218', 'f217', 'f20a', 'f1f3', 'f1f2', 'f1f1', 'f1f4', 'f1f5', 'f1f0', 'f0a3', 'f0c1', 'f127', 'f00c', 'f058', 'f05d', 'f14a', 'f046', 'f13a', 'f137', 'f138', 'f139', 'f078', 'f053', 'f054', 'f077', 'f1ae', 'f111', 'f10c', 'f1ce', 'f1db', 'f0ea', 'f017', 'f00d', 'f0c2', 'f0ed', 'f0ee', 'f157', 'f121', 'f126', 'f1cb', 'f0f4', 'f013', 'f085', 'f0db', 'f075', 'f0e5', 'f086', 'f0e6', 'f14e', 'f066', 'f20e', 'f0c5', 'f1f9', 'f09d', 'f125', 'f05b', 'f13c', 'f1b2', 'f1b3', 'f0c4', 'f0f5', 'f0e4', 'f210', 'f1c0', 'f03b', 'f1a5', 'f108', 'f1bd', 'f219', 'f1a6', 'f155', 'f192', 'f019', 'f17d', 'f16b', 'f1a9', 'f044', 'f052', 'f141', 'f142', 'f1d1', 'f0e0', 'f003', 'f199', 'f12d', 'f153', 'f0ec', 'f12a', 'f06a', 'f071', 'f065', 'f08e', 'f14c', 'f06e', 'f070', 'f1fb', 'f09a', 'f230', 'f082', 'f049', 'f050', 'f1ac', 'f182', 'f0fb', 'f15b', 'f1c6', 'f1c7', 'f1c9', 'f1c3', 'f1c5', 'f1c8', 'f016', 'f1c1', 'f1c4', 'f15c', 'f0f6', 'f1c2', 'f008', 'f0b0', 'f06d', 'f134', 'f024', 'f11e', 'f11d', 'f0c3', 'f16e', 'f0c7', 'f07b', 'f114', 'f07c', 'f115', 'f031', 'f211', 'f04e', 'f180', 'f119', 'f1e3', 'f11b', 'f0e3', 'f154', 'f06b', 'f1d3', 'f1d2', 'f09b', 'f113', 'f092', 'f184', 'f000', 'f0ac', 'f1a0', 'f0d5', 'f0d4', 'f1ee', 'f19d', 'f0c0', 'f0fd', 'f1d4', 'f0a7', 'f0a5', 'f0a4', 'f0a6', 'f0a0', 'f1dc', 'f025', 'f004', 'f08a', 'f21e', 'f1da', 'f015', 'f0f8', 'f13b', 'f20b', 'f03e', 'f01c', 'f03c', 'f129', 'f05a', 'f156', 'f16d', 'f208', 'f033', 'f1aa', 'f1cc', 'f084', 'f11c', 'f159', 'f1ab', 'f109', 'f202', 'f203', 'f06c', 'f212', 'f094', 'f149', 'f148', 'f1cd', 'f0eb', 'f201', 'f0e1', 'f08c', 'f17c', 'f03a', 'f022', 'f0cb', 'f0ca', 'f124', 'f023', 'f175', 'f177', 'f178', 'f176', 'f0d0', 'f076', 'f064', 'f112', 'f122', 'f183', 'f041', 'f222', 'f227', 'f229', 'f22b', 'f22a', 'f136', 'f20c', 'f23a', 'f0fa', 'f11a', 'f223', 'f130', 'f131', 'f068', 'f056', 'f146', 'f147', 'f10b', 'f0d6', 'f186', 'f21c', 'f001', 'f22c', 'f1ea', 'f19b', 'f18c', 'f1fc', 'f1d8', 'f1d9', 'f0c6', 'f1dd', 'f04c', 'f1b0', 'f1ed', 'f040', 'f14b', 'f095', 'f098', 'f200', 'f1a7', 'f1a8', 'f0d2', 'f231', 'f0d3', 'f072', 'f04b', 'f144', 'f01d', 'f1e6', 'f067', 'f055', 'f0fe', 'f196', 'f011', 'f02f', 'f12e', 'f1d6', 'f029', 'f128', 'f059', 'f10d', 'f10e', 'f1d0', 'f074', 'f1b8', 'f1a1', 'f1a2', 'f021', 'f18b', 'f01e', 'f079', 'f018', 'f135', 'f0e2', 'f158', 'f09e', 'f143', 'f002', 'f010', 'f00e', 'f213', 'f233', 'f1e0', 'f1e1', 'f14d', 'f045', 'f132', 'f21a', 'f214', 'f07a', 'f090', 'f08b', 'f012', 'f215', 'f0e8', 'f216', 'f17e', 'f198', 'f1de', 'f1e7', 'f118', 'f0dc', 'f15d', 'f15e', 'f160', 'f161', 'f0de', 'f0dd', 'f162', 'f163', 'f1be', 'f197', 'f110', 'f1b1', 'f1bc', 'f0c8', 'f096', 'f18d', 'f16c', 'f005', 'f089', 'f123', 'f006', 'f1b6', 'f1b7', 'f048', 'f051', 'f0f1', 'f04d', 'f21d', 'f0cc', 'f1a4', 'f1a3', 'f12c', 'f239', 'f0f2', 'f185', 'f12b', 'f0ce', 'f10a', 'f02b', 'f02c', 'f0ae', 'f1d5', 'f120', 'f034', 'f035', 'f00a', 'f009', 'f00b', 'f08d', 'f165', 'f088', 'f087', 'f164', 'f145', 'f057', 'f05c', 'f043', 'f204', 'f205', 'f238', 'f224', 'f225', 'f1f8', 'f014', 'f1bb', 'f181', 'f091', 'f0d1', 'f195', 'f1e4', 'f173', 'f174', 'f1e8', 'f099', 'f081', 'f0e9', 'f0cd', 'f09c', 'f13e', 'f093', 'f007', 'f0f0', 'f234', 'f21b', 'f235', 'f221', 'f226', 'f228', 'f237', 'f03d', 'f194', 'f1ca', 'f189', 'f027', 'f026', 'f028', 'f1d7', 'f18a', 'f232', 'f193', 'f1eb', 'f17a', 'f19a', 'f0ad', 'f168', 'f169', 'f19e', 'f1e9', 'f167', 'f16a', 'f166'];

			for( var i = 0; i < char_table.length; i++ ) {
				var character = char_table[i];

				$('<li/>', {
					'class': 'fa atbb-services-icon',
					'data-char': character
				}).html('&#x' + character + ';').appendTo( icon_selector.list );
				//console.log( chars.html() );
			}

			icon_selector.close = function() {
				icon_selector.hide();
			};

			icon_selector.open = function() {
				icon_selector.show();
			};

			icon_selector.closer.on('click', function() {
				icon_selector.close();
			});

			icon_selector.list.children().on('click', function() {
				var character = $(this).attr('data-char');
				icon_selector.trigger('onselect', [character]);
				icon_selector.close();
			});

			icon_selector.hide().appendTo( $('.atbb-extension-container') );
			icon_selector.data( 'icon_selector', icon_selector );

			return icon_selector;
		}














		function Exporter() {
			builder.exporter = new BuilderWindow( 'exporter', { save: false, title: 'Export' });

			$('<h4/>').text( 'Copy the text below.' ).appendTo( builder.exporter.content );
			$('<em/>').text( 'Click on the text box to select all the contents, then copy.' ).appendTo( builder.exporter.content );

			//$('<hr/>').appendTo( builder.exporter.content );

			var field = $('<textarea/>').appendTo( builder.exporter.content );
				field.prop('readonly', true);
				
			builder.exporter.on('window:open', function() {
				var encoded = builder._export();
				field.val( encoded );

				setTimeout( function() {
					select_all();
				}, 10 );
			});

			function select_all() {
				setTimeout( function(){
					field.select().scrollTop(0);
				}, 10 );
			}

			field.on( 'mousedown', select_all );

			return builder.exporter;
		}













		function Importer() {
			builder.importer = new BuilderWindow( 'importer', { 
				save: { label: 'Import', title: 'Import and close the window' }, 
				title: 'Import'
			});

			$('<h4/>').text( 'Paste the text below.' ).appendTo( builder.importer.content );
			$('<em/>').text( 'Paste the text copied during export into the textarea below. Note: All the current content will be overridden with the imported data.' ).appendTo( builder.importer.content );

			//$('<hr/>').appendTo( builder.exporter.content );

			var field = $('<textarea/>').appendTo( builder.importer.content );
				
			builder.importer.on('window:save', function() {
				try {
					builder._import( field.val() );

					builder.history.add();
				} catch( e ) {
					console.warn( 'Could not import the data.' );
					alert( 'Could not import the data.' );
				}
			});

			builder.importer.on('window:open', function() {
				field.val( '' );

				setTimeout( function() {
					field.focus();
				}, 10 );
			});

			return builder.importer;
		}













		function BuilderWindow( id, args ) {
			var existing_window_element = $('.atbb-extension-container > #' + id);
			if( existing_window_element.length > 0 ) {
				return existing_window_element.data('window');
			}


			var defaults = {
				title: '',
				save: { label: 'OK', title: 'Save and close the window' },
				cancel: { label: 'Close', title: 'Close the window' },
			};
			var settings = $.extend(true, {}, defaults, args);


			var builder_window = $('<div/>', {'class': 'atbb-window', 'id': id});
			var builder_window_wrapper = $('<div/>', {'class': 'atbb-window-wrapper'}).appendTo(builder_window);

			builder_window.buttons = {}; //en empty object to hold buttons

			builder_window.header = $('<div/>', {'class': 'atbb-window-header'}).appendTo(builder_window_wrapper);
			builder_window.title = $('<span/>', {
				'class': 'atbb-window-title'
			}).text( settings.title ).appendTo(builder_window.header);

			builder_window.buttons.close = $('<span/>', {
				'class': 'atbb-window-close fa fa-times'
			}).appendTo(builder_window.header);


			builder_window.content = $('<div/>', {
				'class': 'atbb-window-content'
			}).appendTo(builder_window_wrapper);


			builder_window.footer = $('<div/>', {
				'class': 'atbb-window-footer'
			}).appendTo( builder_window_wrapper );

			if( settings.cancel ) {
				builder_window.buttons.cancel = $('<span/>', {
					'class': 'atbb-window-cancel',
					title: settings.cancel.title
				}).text( settings.cancel.label ).appendTo( builder_window.footer ).on('click', function(e) {
					e.preventDefault();
					builder_window.close();
				});
			}
			
			if( settings.save ) {
				builder_window.buttons.save = $('<span/>', {
					'class': 'atbb-window-save',
					title: settings.save.title
				}).text( settings.save.label ).appendTo( builder_window.footer ).on('click', function(e) {
					e.preventDefault();
					builder_window.save();
				});
			}


			builder_window.close = function() {
				builder_window.trigger( 'window:close' );
				builder_window.hide();
			};

			builder_window.open = function() {
				builder_window.trigger( 'window:open' );
				builder_window.show();
			};

			builder_window.save = function() {
				builder_window.trigger( 'window:save' );
				builder_window.close();
			};


			builder_window.buttons.close.on('click', function(e) {
				e.preventDefault();
				builder_window.close();
			});


			builder_window.hide().appendTo( $('.atbb-extension-container') );
			builder_window.data( 'window', builder_window );

			return builder_window;
		}

		


















		//Option method
		builder.Option = function( option_settings, namespace ) {
			if( option_settings.name === '' ) { return false; }

			var container = $('<div/>').addClass('atbb-builder-option');
			var input = $();

			var defaults = {
				name: undefined,
				value: '',
				type: 'text',
				placeholder: undefined,
				options: undefined,
				title: undefined,
				button: undefined,
				description: undefined,
				block: undefined,
				rows: 3,
				step: undefined,
				min: undefined,
				max: undefined
			};

			var settings = $.extend(true, {}, defaults, option_settings);

			if( settings.block !== undefined ) {
				container.addClass( 'atbb-block' ).addClass( settings.block );
			}

			if( settings.title !== undefined ) {
				$('<h4/>').text( settings.title ).appendTo( container );
			}
			if( settings.description !== undefined ) {
				$('<em/>').text( settings.description ).appendTo( container );
			}




			//build the input
			if( settings.type === 'select' && settings.options ) {
				/* SELECT */
				input = $('<select/>').attr({
					name: namespace + settings.name
				});
				for( var o in settings.options ) {
					$('<option/>').attr({
						value: o
					}).appendTo( input ).text( settings.options[o] );
				}
				input.data('settings', settings).addClass('atbb-data-field').appendTo( container ).val(settings.value).trigger('change');
			} else if( settings.type === 'textarea' ) {
				/* TEXTAREA */
				input = $('<textarea/>').attr({
					name: namespace + settings.name,
					rows: settings.rows
				}).data('settings', settings).addClass('atbb-data-field').appendTo( container ).val( settings.value ).trigger('change');
			} else if( settings.type === 'checkbox' ) {
				/* CHECKBOX */
				input = $('<input/>').attr({
					name: namespace + settings.name,
					value: true,
					type: settings.type
				}).data('settings', settings).addClass('atbb-data-field').appendTo( container );

				if( settings.value && settings.value !== '' ) {
					input.prop( 'checked', settings.value );
				}
			} else if( settings.type === 'mce' || settings.type === 'wp_editor' ) {
				/* mceEditor */
				input = $('<textarea/>').attr({
					name: namespace + settings.name,
					rows: settings.rows
				}).data('settings', settings).addClass('atbb-mce-editor atbb-data-field').appendTo( container ).val( settings.value ).trigger('change');
			} else if( settings.type === 'media' ) {
				/* Media Selector */
				var wrapper = $('<div/>', {'class': 'atbb-media-field-wrapper'}).appendTo( container );

				input = $('<input/>').attr({
					name: namespace + settings.name + '[url]',
					value: settings.value.url,
					type: 'text',
					placeholder: settings.placeholder
				}).data('settings', settings).addClass('atbb-data-field atbb-media-field').appendTo( wrapper );

				var id_field = $('<input/>').attr({
					name: namespace + settings.name + '[id]',
					value: settings.value.id,
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');

				var mime_field = $('<input/>').attr({
					name: namespace + settings.name + '[mime]',
					value: settings.value.mime,
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');

				var type_field = $('<input/>').attr({
					name: namespace + settings.name + '[type]',
					value: settings.value.type,
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');


				//-------
				var width_field = $('<input/>').attr({
					name: namespace + settings.name + '[width]',
					value: settings.value.width,
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');

				var height_field = $('<input/>').attr({
					name: namespace + settings.name + '[height]',
					value: settings.value.height,
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');


				//-------
				var thumb_size_field = $('<input/>').attr({
					name: namespace + settings.name + '[thumbnail]',
					value: settings.value.thumbnail ? settings.value.thumbnail : '',
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');

				var medium_size_field = $('<input/>').attr({
					name: namespace + settings.name + '[medium]',
					value: settings.value.medium ? settings.value.medium : '',
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');

				var large_size_field = $('<input/>').attr({
					name: namespace + settings.name + '[large]',
					value: settings.value.large ? settings.value.large : '',
					type: 'hidden'
				}).addClass('atbb-data-field').appendTo( wrapper ).trigger('change');
				//-------

				var button = $('<span/>', {'class': 'atbb-media-field-button fa fa-folder-open'}).appendTo( wrapper );
				var clear = $('<span/>', {'class': 'atbb-media-field-clear fa fa-times'}).appendTo( wrapper ).hide();

				button.on('click', function( e ) {
					var media_window = new BoxBuilderMediaWindow();
					
					media_window.on('mediaselect', function( e, data ) {
						//console.log(data);

						id_field.val( data.id !== undefined ? data.id : '' );
						mime_field.val( data.mime !== undefined ? data.mime : '' );
						type_field.val( data.type !== undefined ? data.type : '' );

						width_field.val( data.width !== undefined ? data.width : '' );
						height_field.val( data.height !== undefined ? data.height : '' );

						thumb_size_field.val('');
						medium_size_field.val('');
						large_size_field.val('');

						if( data.sizes !== undefined && data.sizes.thumbnail !== undefined ) {
							thumb_size_field.val( data.sizes.thumbnail.url !== undefined ? data.sizes.thumbnail.url : '' );
						}

						if( data.sizes !== undefined && data.sizes.medium !== undefined ) {
							medium_size_field.val( data.sizes.medium.url !== undefined ? data.sizes.medium.url : '' );
						}

						if( data.sizes !== undefined && data.sizes.large !== undefined ) {
							large_size_field.val( data.sizes.large.url !== undefined ? data.sizes.large.url : '' );
						}

						input.val( data.url !== undefined ? data.url : '' ).trigger('change');
						//console.log( data );
						clear.show();
						input.attr({
							'readonly': 'true'
						});
					});
				});

				if( settings.value.id && settings.value.type ) {
					clear.show();
					input.attr({
						'readonly': 'true'
					});
				}

				clear.on('click', function( e ){
					e.preventDefault();
					$(this).hide();

					input.removeAttr( 'readonly' );

					input.val('');
					id_field.val('');
					type_field.val('');

					width_field.val('');
					height_field.val('');

					mime_field.val('');
					thumb_size_field.val('');

					input.trigger('change');
				});

				input.on('change', function() {
					//console.log( type_field.val() );
					wrapper.find('.atbb-media-wrapper').remove();
					if( type_field.val() === 'image' || isImage(input.val()) ) {
						var media_wrapepr = $('<div/>', {'class': 'atbb-media-wrapper'}).appendTo( wrapper );
						var toggle = $('<span/>', {'class': 'atbb-media-toggle-button fa fa-caret-down'}).appendTo( media_wrapepr );

						$('<div/>', {
							'class': 'atbb-media-thumbnail'
						}).css({
							'background-image': 'url('+ $(this).val() +')'
						}).appendTo( media_wrapepr );

						toggle.on('click', function( e ) {
							e.preventDefault();
							media_wrapepr.toggleClass('atbb-media-wrapper-open');
							if( media_wrapepr.hasClass('atbb-media-wrapper-open') ) {
								toggle.removeClass('fa-caret-down');
								toggle.addClass('fa-caret-up');
							} else {
								toggle.removeClass('fa-caret-up');
								toggle.addClass('fa-caret-down');
							}
						});
					}
				});
				input.trigger('change');
			} else if( settings.type === 'icon' ) {
				/* ICON */
				var icon_button = $('<div/>', {'class': 'atbb-icon-selector-button'}).appendTo( container );
				input = $('<input/>').attr({
					name: namespace + settings.name,
					value: settings.value,
					type: 'hidden'
				}).data('settings', settings).addClass('atbb-data-field').appendTo( container ).trigger('change');

				icon_button.on('click', function() {
					var icon_selector = new IconSelector();
					
					if( icon_selector.open !== undefined ) {
						icon_selector.open();
						icon_selector.find('.atbb-services-icon').removeClass('atbb-selected-icon').filter('[data-char="'+input.val()+'"]').addClass('atbb-selected-icon');
					}

					icon_selector.off('onselect');
					icon_selector.on('onselect', function(e, character) {
						//console.log( character );
						input.val( character );

						icon_button.html( '&#x' + character + ';' );
						icon_selector.find('.atbb-services-icon').removeClass('atbb-selected-icon').filter('[data-char="'+character+'"]').addClass('atbb-selected-icon');
					});

					
				});
				if( settings.value !== undefined && settings.value !== '' ) {
					icon_button.html( '&#x' + settings.value + ';' );
				}
			/* COLOR */
			} else if( settings.type === 'color' ) {

				input = $('<input/>').attr({
					name: namespace + settings.name,
					value: settings.value,
					type: 'text',
				}).data('settings', settings).addClass('atbb-data-field').appendTo( container ).trigger('change');

				if( input.wpColorPicker && typeof(input.wpColorPicker) === 'function' ) {
					input.wpColorPicker();
				}
				

			} else {
				/* TEXT/NUMBER/EMAIL/ETC... */
				input = $('<input/>').attr({
					name: namespace + settings.name,
					value: settings.value,
					type: settings.type,
					placeholder: settings.placeholder
				}).data('settings', settings).addClass('atbb-data-field').appendTo( container ).trigger('change');

				if( settings.step !== undefined ) {
					input.attr({
						step: settings.step
					});
				}

				if( settings.min !== undefined ) {
					input.attr({
						min: settings.min
					});
				}

				if( settings.max !== undefined ) {
					input.attr({
						max: settings.max
					});
				}
			}

			var event_type = 'change';
			if( settings.type !== 'select' && settings.type !== 'checkbox' ) {
				event_type = 'input';
			}

			container.on(event_type, '.atbb-data-field', function() {
				var value = $(this).val();
				container.trigger( 'fieldchange', [value] );
			});

			container.field = input;
			return container;
		};// END Option





















































		//helper functions
		function arrayUnique( arr ) {
			var u = {}, a = [];
			for(var i = 0, l = arr.length; i < l; ++i) {
				if(u.hasOwnProperty(arr[i])) {
					continue;
				}
				a.push(arr[i]);
				u[arr[i]] = 1;
			}
			return a;
		}


		function hex2rgb( hex ) {
			hex = (hex.substr(0,1)=='#') ? hex.substr(1) : hex;
			return [parseInt(hex.substr(0,2), 16), parseInt(hex.substr(2,2), 16), parseInt(hex.substr(4,2), 16)];
		}


		function arraysEqual( arr1, arr2 ) {
			if( arr1.length !== arr2.length ) {
				return false;
			}
			for( var i = arr1.length; i--; ) {
				if(arr1[i] !== arr2[i]) {
					return false;
				}
			}
			return true;
		}

		function objectLength( obj ) {
			var size = 0;
			for ( var key in obj ) {
				if ( obj.hasOwnProperty( key ) ) {
					size++;
				}
			}
			return size;
		}

		function isImage( url ) {
			return (url.match(/\.(jpeg|jpg|gif|png)$/) !== null);
		}


		//call the consturctor to build the 
		construct();
		//console.log( builder, settings );
		return this;
	}







	window.BoxBuilderMediaWindow = function( sett ) {
		var file_frame;
		var media_window = $('<span/>');

		var settings = $.extend({
			title: 'Select Media',
			button: false,
			library: false,
		}, sett);
		
		// If the media frame already exists, reopen it.
		if ( file_frame ) {
			file_frame.open();
			return;
		}
		// Create the media frame.
		file_frame = wp.media.frames.file_frame = wp.media({
				title: settings.title,
				button: {
					text: settings.button ? settings.button : $( this ).data( 'uploader_button_text' )
				},
				library: {
					type: settings.library ? settings.library : 'image, video'
				},
			multiple: false  // Set to true to allow multiple files to be selected
		});

		// When an image is selected, run a callback.
		file_frame.on( 'select', function() {
			// We set multiple to false so only get one image from the uploader
			var attachment = file_frame.state().get('selection').first().toJSON();
			//console.log( attachment );
			media_window.trigger( 'mediaselect', [attachment] );
			//console.log(file_frame);
		});

		// Finally, open the modal
		file_frame.open();
		return media_window;
	}




	/* jQUery MCE Editor */
	$.fn.buildMCEEditor = function() {
		var element = this;
		if( !element.is('textarea') || element.hasClass('atbb-has-mce-editor') ) return;
		//check for mce settings
		if( !tinyMCEPreInit || !tinyMCEPreInit.mceInit || !tinyMCEPreInit.mceInit.content ) return false;
		//check for quicktag settings
		if( !tinyMCEPreInit || !tinyMCEPreInit.qtInit || !tinyMCEPreInit.qtInit.content ) return false;


		wpActiveEditor = '';
		var ID = 'mce-editor-' + Date.now();
			element.attr('id', ID);

		var option_wrapper = element.parent('.atbb-builder-option');
		var lineheight = !isNaN( parseInt(element.css('line-height')) ) ? parseInt(element.css('line-height')) : 24
		var height = parseInt( element.attr('rows') ? element.attr('rows') : 5, 10) * lineheight;
			element.css({ 'min-height': height });

		var wp_editor_wrap = $('<div/>').attr({
				id: 'wp-'+ ID +'-wrap'
			}).addClass('wp-core-ui wp-editor-wrap html-active').appendTo( option_wrapper ).css({
				visibility: 'hidden'
			});

		var wp_editor_tools = $('<div/>').attr({
				id: 'wp-'+ ID +'-editor-tools'
			}).addClass('wp-editor-tools hide-if-no-js').appendTo( wp_editor_wrap );
			//
		var wp_editor_tabs = $('<div/>').addClass('wp-editor-tabs').appendTo( wp_editor_tools );
			//
			$('<button/>').attr({
				id: ID +'-tmce',
				'data-wp-editor-id': ID,
				//onclick: 'switchEditors.switchto(this);'
			}).addClass('wp-switch-editor switch-tmce').text('Visual').appendTo( wp_editor_tabs )
				.on('click', function() {
					if( switchEditors && switchEditors.go ) {
						switchEditors.go( ID, 'tmce' );
					}
					return false;
				});
			//
			$('<button/>').attr({
				id: ID +'-html',
				'data-wp-editor-id': ID,
				//onclick: 'switchEditors.switchto(this);'
			}).addClass('wp-switch-editor switch-html').text('Text').appendTo( wp_editor_tabs )
				.on('click', function() {
					if( switchEditors && switchEditors.go ) {
						switchEditors.go( ID, 'html' );
					}
					return false;
				});
			
			//
		var wp_media_buttons = $('<div/>').attr({
				id: 'wp-'+ ID +'-media-buttons'
			}).addClass('wp-media-buttons').appendTo( wp_editor_tools );
		//
		var add_media = $('<a/>').attr({
				'data-editor': ID,
				title: 'Add Media'
			}).addClass('button insert-media add_media').html('<span class="wp-media-buttons-icon"></span> Add Media').appendTo( wp_media_buttons );

			add_media.on('click', function() { wpActiveEditor = ID; });
		//
		var wp_editor_container = $('<div/>').attr({
				id: 'wp-'+ ID +'-editor-container'
			}).addClass('wp-editor-container').appendTo( wp_editor_wrap );

		element.appendTo( wp_editor_container );
		//


		function initMCE() {
			for ( var mce_editor in tinyMCEPreInit.mceInit ) {
				tinyMCEPreInit.mceInit[ ID ] = $.extend( true, {}, tinyMCEPreInit.mceInit[ mce_editor ] );

				if( tinyMCEPreInit.mceInit[ ID ].selector && tinyMCEPreInit.mceInit[ ID ].plugins ) {
					tinyMCEPreInit.mceInit[ ID ].plugins = tinyMCEPreInit.mceInit[ ID ].plugins.replace(',wpfullscreen', '');
					tinyMCEPreInit.mceInit[ ID ].plugins = tinyMCEPreInit.mceInit[ ID ].plugins.replace(',fullscreen', '');
				}

				if( tinyMCEPreInit.mceInit[ ID ].selector && tinyMCEPreInit.mceInit[ ID ].toolbar1 ) {
					tinyMCEPreInit.mceInit[ ID ].toolbar1 = tinyMCEPreInit.mceInit[ ID ].toolbar1.replace(',wp_fullscreen', '');
					tinyMCEPreInit.mceInit[ ID ].toolbar1 = tinyMCEPreInit.mceInit[ ID ].toolbar1.replace(',dfw', '');
				}

				tinyMCEPreInit.mceInit[ ID ].selector = '#' + ID;
				tinyMCEPreInit.mceInit[ ID ].elements = ID;
				tinyMCEPreInit.mceInit[ ID ].body_class = ID;
				tinyMCEPreInit.mceInit[ ID ].resize = true;

				//tinyMCEPreInit.mceInit[ ID ].height = 300;

				tinyMCEPreInit.mceInit[ ID ].setup = function(ed) {
					//console.log('....',tinyMCEPreInit.mceInit);
					try {
						ed.on('init', function(e) {
							//wp_editor_wrap.find('#'+ ID +'_ifr').css({ height: height });
							//console.log('on init', height);
							initQTs();
						});
					} catch( e ) {
						ed.onInit.add(function(ed) {
							//console.debug('Editor was activated: ' + ed.id);
							//wp_editor_wrap.find('#'+ ID +'_ifr').css({ height: height });
							initQTs();
						});
						console.log( 'Falling back to old tinymce init event.' );
					}
				};
				//console.log(tinymce.init);
				try {
					//console.log('do init');
					tinymce.init( tinyMCEPreInit.mceInit[ ID ] );
					element.addClass('atbb-has-mce-editor');
					
					//builder.mceEditorsTotal++;
				} catch( e ) {
					console.log( 'Could not initiate mceEditor on the textfield:', ID, e );
				}
				//******
				break;
			}
		} //END function initMCE()



		function initQTs() {
			//-------------- setup the quicktags
			for ( var qt_editor in tinyMCEPreInit.qtInit ) {
				tinyMCEPreInit.qtInit[ ID ] = $.extend( true, {}, tinyMCEPreInit.qtInit[ qt_editor ] );
				tinyMCEPreInit.qtInit[ ID ].id = ID;
				tinyMCEPreInit.qtInit[ ID ].buttons = tinyMCEPreInit.qtInit[ ID ].buttons.replace(',fullscreen', '');
				tinyMCEPreInit.qtInit[ ID ].buttons = tinyMCEPreInit.qtInit[ ID ].buttons.replace(',dfw', '');
				try {
					//console.log(  );
					quicktags( tinyMCEPreInit.qtInit[ ID ] );
					QTags._buttonsInit();
					textarea.addClass('atbb-has-quicktag-editor');
				} catch( e ) {
					//console.log( 'Could not initiate quicktags on the textfield:', ID );
				}
				break;
			}
			//wpActiveEditor = ID;

			if( switchEditors && switchEditors.go ) {
				switchEditors.go( ID, 'html' );
				switchEditors.go( ID, 'tmce' );
			}

			setTimeout(function(){ 
				wp_editor_wrap.css({ visibility: 'visible' });
				wp_editor_wrap.find('#'+ ID +'_ifr').css({ 'min-height': height });
			}, 100);
		}//END function initQTs()




		initMCE();

		element.data('editor', element);
		return element;
	}






















	$.fn.destroyMCEEditor = function() {
		var element = this;
		if( !element.is('textarea') || !element.hasClass('atbb-has-mce-editor') ) return;
		//check for mce settings
		if( !tinyMCEPreInit || !tinyMCEPreInit.mceInit || !tinyMCEPreInit.mceInit.content ) return false;
		//check for quicktag settings
		if( !tinyMCEPreInit || !tinyMCEPreInit.qtInit || !tinyMCEPreInit.qtInit.content ) return false;

		var ID = element.attr('id');
		var output = '';

		//console.log(ID);

		function saveMCEEditor() {
			if( window.tinymce && typeof tinymce.get === 'function' && tinymce.get(ID) instanceof tinymce.Editor ) {
				var editor = tinymce.get(ID);
				
				if( switchEditors && switchEditors.go ) {
					switchEditors.go( ID, 'tmce' );
				}
				output = editor.save();
				
				if( switchEditors !== undefined && typeof switchEditors.wpautop === 'function' ) {
					var val_preautoped = switchEditors.pre_wpautop( output );
					var val_autoped = switchEditors.wpautop( val_preautoped );
						output = val_autoped;

					//console.log(val_autoped);
				}
			}
		}
		saveMCEEditor();

		function removeMCEEditor() {
			delete tinyMCEPreInit.mceInit[ element.attr('id') ];
			delete tinyMCEPreInit.qtInit[ element.ID ];

			tinymce.remove( tinymce.get(ID) );

			var option_wrapper = $('.atbb-builder-option').has(element);
			var wp_editor_wrap = $('.wp-editor-wrap').has(element);

				element.appendTo(option_wrapper);
				element.val( output );

				element.removeAttr('style').removeClass('atbb-has-quicktag-editor').removeClass('atbb-has-mce-editor');

				wp_editor_wrap.remove();

			//console.log( 'Deleting:', ID, element.get() );
		}
		removeMCEEditor();

		return element;
	}







	








	// use to parse bracket notation like my[name][attribute]
	var keyBreaker = /[^\[\]]+/g;
	// converts values that look like numbers and booleans and removes empty strings
	var convertValue = function( value ) {
		if ( $.isNumeric( value )) {
			return parseFloat( value );
		} else if ( value === 'true') {
			return true;
		} else if ( value === 'false' ) {
			return false;
		} else if ( value === '' || value === null ) {
			return undefined;
		}
		return value;
	};
	// Access nested data
	var nestData = function( elem, type, data, parts, value, seen, fullName ) {
		var name = parts.shift();
		// Keep track of the dot separated fullname. Used to uniquely track seen values
		// and if they should be converted to an array or not
		fullName = fullName ? fullName + '.' + name : name;
		if ( parts.length ) {
			if ( ! data[ name ] ) {
				data[ name ] = {};
			}
			// Recursive call
			nestData( elem, type, data[ name ], parts, value, seen, fullName);
		} else {
			// Handle same name case, as well as "last checkbox checked"
			// case
			if ( fullName in seen && type != 'radio' && ! $.isArray( data[ name ] )) {
				if ( name in data ) {
					data[ name ] = [ data[name] ];
				} else {
					data[ name ] = [];
				}
			} else {
				seen[ fullName ] = true;
			}
			// Finally, assign data
			if ( ( type == 'radio' || type == 'checkbox' ) && ! elem.is(':checked') ) {
				return;
			}
			if ( ! data[ name ] ) {
				data[ name ] = value;
			} else {
				data[ name ].push( value );
			}
		}
	};

	/**
	 * @function jQuery.fn.formParams
	 * @parent jQuery.formParams
	 * @plugin jquerypp/dom/form_params
	 * @test jquerypp/dom/form_params/qunit.html
	 * @hide
	 *
	 * Returns a JavaScript object for values in a form.
	 * It creates nested objects by using bracket notation in the form element name.
	 *
	 * @param {Object} [params] If an object is passed, the form will be repopulated
	 * with the values of the object based on the name of the inputs within
	 * the form
	 * @param {Boolean} [convert=false] True if strings that look like numbers
	 * and booleans should be converted and if empty string should not be added
	 * to the result.
	 * @return {Object} An object of name-value pairs.
	 */
	$.fn.extend({
		formParams: function( params ) {
			var convert;
			// Quick way to determine if something is a boolean
			if ( Boolean(params) === params ) {
				convert = params;
				params = null;
			}
			if ( params ) {
				return this.setParams( params );
			} else {
				return this.getParams( convert );
			}
		},
		setParams: function( params ) {
			// Find all the inputs
			this.find('[name]').each(function() {
				var $this = $(this),
					value = params[ $this.attr('name') ];
				// Don't do all this work if there's no value
				if ( value !== undefined ) {
					// Nested these if statements for performance
					if ( $this.is(':radio') ) {
						if ( $this.val() == value ) {
							$this.attr('checked', true);
						}
					} else if ( $this.is(':checkbox') ) {
						// Convert single value to an array to reduce
						// complexity
						value = $.isArray( value ) ? value : [value];
						if ( $.inArray( $this.val(), value ) > -1) {
							$this.attr('checked', true);
						}
					} else {
						$this.val( value );
					}
				}
			});
		},
		getParams: function( convert ) {
			var data = {};
				// This is used to keep track of the checkbox names that we've
				// already seen, so we know that we should return an array if
				// we see it multiple times. Fixes last checkbox checked bug.
			var seen = {};
			this.find('[name]:not(:disabled)').each(function() {
				var $this    = $(this),
					type     = $this.attr('type'),
					name     = $this.attr('name'),
					value    = $this.val(),
					parts;
				// Don't accumulate submit buttons and nameless elements
				if ( type == 'submit' || ! name ) {
					return;
				}
				// Figure out name parts
				parts = name.match( keyBreaker );
				if ( ! parts.length ) {
					parts = [name];
				}
				// Convert the value
				if ( convert ) {
					value = convertValue( value );
				}
				// Assign data recursively
				nestData( $this, type, data, parts, value, seen );
			});
			return data;
		}
	});
	















	/* Instantiate BoxBuilder if there are layouts present */
	$(window).load(function() {
		//show the switch button on window load
		$('.atbb-switch-builder').show();
		//console.log(button);

		//check if there are layouts
		if( atbb_settings !== undefined && atbb_settings.data !== '' ) {
			//button.trigger('click');
		}

		//button.trigger('click');
	});
})(jQuery);

