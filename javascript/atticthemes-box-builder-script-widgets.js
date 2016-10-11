/* global console:false, jQuery:false, atticthemes_box_builder:false, tinymce:false */

(function($) {
	'use strict';
	//check if "atticthemes_box_builder" is defined, if not, just return, do not run the rest.
	if( window.atticthemes_box_builder === undefined ) {
		return;
	}

	var builder = atticthemes_box_builder;

	/* ========================================================================== */
	/* ========================================================================== */
	/* ===============================Text Block================================= */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'TextBlock', {
		title: 'Text Block', //This will be shown in the "Widget Selection" window.
		'class': 'text-block', //this will be refixed with "atbb-widget-selector-" so the complete class will look like "atbb-widget-selector-text-block"

		//.editor method is ran when the "BoxBulder" is executing the creation of widgets and builds the editors for those.
		editor: function( widget ) {
			widget.editor.title.text( 'Text Block Widget Settings' );
			//console.log( widget.namespace );

			new widget.Option({
				title: 'Text Block Content',
				description: 'This widget is meant to be used as text blog, but it can carry any content that can be put in the default WordPress editor.',
				type: 'mce',
				rows: 10,
				name: '[content]',
				value: widget.settings.content ? widget.settings.content : 'Sample content for the "Text Block Widget".'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );

			
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				//console.log( settings );
				widget.setContent( settings.content ? settings.content : '' );
			});
		},
		//this function is being ran on every widget when the user saves or updates the post. This builds the HTML/output that must be added in the content on the front-end. Note that this can output shortcodes as well as contian both html and shortcodes.
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var classes = ' ' + (settings['class'] ? settings['class'] : '');

			output += '<div class="atbb-text-block'+ classes +'">\n';
			output += settings.content ? settings.content : '';
			output += '\n</div>';
			
			return output;
		}
	});










	/* ========================================================================== */
	/* ========================================================================== */
	/* ==============================Media Gallery=============================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'MediaGallery', {
		title: 'Media Gallery',
		'class': 'media-gallery',

		editor: function( widget ) {
			widget.editor.title.text( 'Gallery Settings' );
			//----------------------
			$('<h2/>',{'class': 'atbb-widget-option-heading'}).text('Media Gallery').appendTo(widget.editor);
			$('<em/>').html('You may add media using the button above or clone exsiting ones and edit further. These can be sorted and removed as well. You may use the "Grid" view to easly sort the order. By <strong>"Double Clicking"</strong> the thumbnails in "Grid" view you will access the "List" and have the item you clicked on ready to be edited.').appendTo(widget.editor);
			//build the sortable container with '['media-items']' as namespace
			var container = new widget.SortableContainer( '[media-items]' );
			container.appendTo( widget.editor );
			var settings = widget.getSettings();
			if( widget.settings['media-items'] ) {
				$.each(widget.settings['media-items'], function( tg ) {
					if( widget.settings['media-items'][tg] ) {
						addMediaItem( widget.settings['media-items'][ tg ] );
					}
				});
			} else if( settings['media-items'] === undefined ) {
				addMediaItem( {caption: '* Media'} );
			}

			function addMediaItem( values ) {
				var media_item = container.addGroup();

				//===================================================
				var item_thumbnail = $('<div/>', {
					'class': 'atbb-media-gallery-grid-thumb atbb-widget-options-group-handle atbb-has-no-thumb'
					/*title: 'Douple click to edit the media item.'*/
				}).prependTo( media_item );

				var thumb_remove_button = $('<span/>', {'class': 'fa fa-times atbb-media-gallery-grid-thumb-remove-button'}).appendTo( item_thumbnail );
				var thumb_edit_button = $('<span/>', {'class': 'fa fa-pencil atbb-media-gallery-grid-thumb-edit-button'}).appendTo( item_thumbnail );

				thumb_remove_button.on('click', function( e ) {
					e.preventDefault();
					media_item.Remove();
				});

				thumb_edit_button.on('click', function( e ) {
					e.preventDefault();
					goToListMediaItem();
				});

				item_thumbnail.on('dblclick', function( e ) {
					e.preventDefault();
					goToListMediaItem();
				});

				function goToListMediaItem() {
					widget.editor.scrollTop( 0 );
					
					closeAllGroups();

					toggleView();
					media_item.toggle( 'open' );
					//console.log( container.position().top, media_item.position().top );
					widget.editor.scrollTop( media_item.position().top );
				}
				//===================================================

				if( !values ) {
					values = {};
				}

				//caption
				var caption = media_item.addOption({
					title: 'Caption / Title',
					description: 'Set a caption that will be shown in the lightbox.',
					type: 'text',
					name: '[caption]',
					value: values.caption ? values.caption : ''
				});

				//thumbnail
				media_item.addOption({
					title: 'Thumbnail',
					description: 'Set a thumbnial image.',
					type: 'media',
					name: '[thumbnail]',
					value: values.thumbnail ? values.thumbnail : ''
				});

				//link
				media_item.addOption({
					title: 'Link',
					description: 'The link can be eaither an address of a website, image, YouTube video or a Vimeo video. You may select the media using the media selector or set it manualy. Note: If lightbox is selected as the link target then the link specified here, even if it is a website link, will be opened in a lightbox. Also, both long and short YouTube URLs work.',
					type: 'media',
					name: '[link]',
					value: values.link ? values.link : '',
					placeholder: 'Example: http://www.youtube.com/watch?v=1a_68mRW-Q4'
				});

				//link target
				media_item.addOption({
					title: 'Link Target',
					description: 'Set the link target.',
					type: 'select',
					options: {
						'_self': 'Same Window/Tab',
						'_blank': 'New Window/Tab',
						'lightbox': 'Lightbox'
					},
					name: '[link_target]',
					value: values.link_target ? values.link_target : 'lightbox'
				});

				//video dimensions
				media_item.addOption({
					title: 'Video Width',
					description: 'Set the width for the video. Note: this will take effect if lightbox is selected as link target.',
					type: 'number',
					name: '[video_width]',
					value: values.video_width ? values.video_width : 640
				});

				media_item.addOption({
					title: 'Video Height',
					description: 'Set the height for the video. Note: this will take effect if lightbox is selected as link target.',
					type: 'number',
					name: '[video_height]',
					value: values.video_height ? values.video_height : 480
				});

				media_item.title.text( values.caption ? values.caption : '' );
				caption.on('fieldchange', function( e, value ) {
					media_item.title.text( value );
				});

				media_item.onClone( addMediaItem );
				return media_item;
			}

			var add_media_item_button = new widget.editor.HeaderControl( 'fa-plus' );
				add_media_item_button.setLabel( 'Add Media Item' );
				add_media_item_button.on('click', function( e ) {
					e.preventDefault();
					addMediaItem();
				});

			//--------------------------------------------------------

			var gallery_type = new widget.Option({
				title: 'Gallery Type',
				description: 'Select the gallery type. The "Grid Gallery" is a standard gallery with specific number of columns, where a "Slider Gallery" is a slideshow of images (baner rotator) and has no columns property.',
				type: 'select',
				options: {
					'grid': 'Grid Gallery',
					'slider': 'Slider Gallery'
				},
				name: '[type]',
				value: widget.settings.type ? widget.settings.type : 'grid'
			});
			gallery_type.appendTo( widget.editor );

			var gallery_settings_cont = $('<div/>').appendTo( widget.editor );

			gallery_type.on('fieldchange', function() {
				var type_settings = widget.getSettings();
				gallery_settings_cont.children().remove();

				//console.log( type_settings )
				//if grid gallery
				if( type_settings.type === 'grid' ) {

					var columns = new widget.Option({
						title: 'Columns',
						description: 'Select the number of columns',
						type: 'select',
						options: {
							'2': '2',
							'3': '3',
							'4': '4'
						},
						name: '[columns]',
						value: widget.settings.columns ? widget.settings.columns : '3'
					}).appendTo( gallery_settings_cont );
					
					var use_masonry = new widget.Option({
						title: 'Use Masonry',
						description: 'Check the box if you wish to position items in the gallery with masonry effect.',
						type: 'checkbox',
						name: '[use_masonry]',
						value: widget.settings.use_masonry ? widget.settings.use_masonry : false
					}).appendTo( gallery_settings_cont );


					//if slider gallery
					//------
				} else if( type_settings.type === 'slider' ) {
					
					var animation_type = new widget.Option({
						title: 'Animation Type',
						description: 'Set the slideshow animation type.',
						type: 'select',
						options: {
							'fade': 'Fade',
							'slide': 'Slide'
						},
						name: '[animation_type]',
						value: widget.settings.animation_type ? widget.settings.animation_type : 'fade'
					}).appendTo( gallery_settings_cont );

					var slideshow_speed = new widget.Option({
						title: 'Slideshow Speed',
						description: 'Set the pause time between slides (in seconds).',
						type: 'number',
						name: '[slideshow_speed]',
						step: 0.1,
						min: 0,
						value: widget.settings.slideshow_speed ? widget.settings.slideshow_speed : 6
					}).appendTo( gallery_settings_cont );

					var animation_speed = new widget.Option({
						title: 'Slideshow Speed',
						description: 'Set the animation duration (in seconds).',
						type: 'number',
						name: '[animation_speed]',
						step: 0.1,
						min: 0,
						value: widget.settings.animation_speed ? widget.settings.animation_speed : 0.6
					}).appendTo( gallery_settings_cont );

					var use_controls = new widget.Option({
						title: 'Use Directional Controls',
						description: 'Check the box if you wish to have next and previous buttons for the slider.',
						type: 'checkbox',
						name: '[use_controls]',
						value: widget.settings.use_controls ? widget.settings.use_controls : false
					}).appendTo( gallery_settings_cont );

					var use_paginate_controls = new widget.Option({
						title: 'Use Pagination Controls',
						description: 'Check the box if you wish to have the pagination buttons ("Dots Naviagtion") for the slider.',
						type: 'checkbox',
						name: '[use_paginate_controls]',
						value: widget.settings.use_paginate_controls ? widget.settings.use_paginate_controls : false
					}).appendTo( gallery_settings_cont );
				} //end if
				
			});
			gallery_type.trigger('fieldchange');
			



			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//==============================================================
			var to_thumbs = false;
			var thumbs_toggle = new widget.editor.HeaderControl( 'fa-th atbb-header-control-gallery-toggle' );
				thumbs_toggle.setLabel( 'Grid' );

				thumbs_toggle.on('click', function( e ) {
					e.preventDefault();
					toggleView();
				});

			function toggleView() {
				if( !to_thumbs ) {
					if( showGrid() ) {
						thumbs_toggle.removeClass( 'fa-th atbb-header-control-gallery-toggle' );
						thumbs_toggle.addClass( 'fa-th-list' );
						thumbs_toggle.setLabel( 'List' );
						to_thumbs = true;
					}
				} else {
					if( showList() ) {
						thumbs_toggle.removeClass( 'fa-th-list' );
						thumbs_toggle.addClass( 'fa-th atbb-header-control-gallery-toggle' );
						thumbs_toggle.setLabel( 'Grid' );
						to_thumbs = false;
					}
				}
				//closeAllGroups();
				widget.editor.scrollTop( 0 );
			}
			toggleView();

			function showGrid() {
				if( applyImages() ) {
					container.addClass( 'atbb-media-gallery-grid-view' );
					return true;
				} else {
					return false;
				}
			}

			function showList() {
				container.removeClass( 'atbb-media-gallery-grid-view' );
				return true;
			}

			function applyImages() {
				var settings = widget.getSettings();
				if( settings['media-items'] === undefined ) {
					return false;
				}
				$.each( settings['media-items'], function( i ) {
					var item_settings = this;
					var grid_thumb = container.children('li').eq( i ).find('.atbb-media-gallery-grid-thumb');

					if( item_settings.thumbnail !== undefined && item_settings.thumbnail.thumbnail !== undefined ) {
						grid_thumb.removeClass('atbb-has-no-thumb').css({
							'background-image': 'url('+ item_settings.thumbnail.thumbnail +')'
						});
					}
				});
				return true;
			}

			function closeAllGroups() {
				var all_media_item = container.getGroups();
				$.each(all_media_item, function() {
					if( this.toggle ) {
						this.toggle( 'close' );
					}
				});
			}
			//==============================================================




			//--------------------------------------------------------
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var content = $('<ul/>');
				//console.log( settings );
				if( settings['media-items'] === undefined ) {
					widget.setContent( '' );
					return;
				}

				switch( settings.type ) {
					case 'grid':
						content.addClass( 'atbb-grid-gallery' );
						$.each( settings['media-items'], function( i ) {
							var item_settings = this;
							var margin = 2;
							var columns = parseInt((settings.columns ? settings.columns : 3), 10);
							var width = (100 - (columns-1) * margin) / columns;
							var num = parseInt(i, 10) + 1;

							var item = $('<li/>',{'class': 'atbb-grid-gallery-item atbb-has-no-thumb'}).css({
								width: (Math.floor( width * 100 ) / 100) + '%',
								'margin-right': num % columns === 0 ? 0 : margin + '%',
								'padding-bottom': (Math.floor( width * 100 ) / 100) + '%'
							}).appendTo( content );

							if( item_settings.thumbnail !== undefined && item_settings.thumbnail.large !== undefined ) {
								item.css({'background-image': 'url('+ item_settings.thumbnail.large +')'});
								item.removeClass('atbb-has-no-thumb');
							} else if( item_settings.thumbnail !== undefined && item_settings.thumbnail.medium !== undefined ) {
								item.css({'background-image': 'url('+ item_settings.thumbnail.medium +')'});
								item.removeClass('atbb-has-no-thumb');
							} else if( item_settings.thumbnail !== undefined && item_settings.thumbnail.thumbnail !== undefined ) {
								item.css({'background-image': 'url('+ item_settings.thumbnail.thumbnail +')'});
								item.removeClass('atbb-has-no-thumb');
							} else if( item_settings.thumbnail !== undefined && item_settings.thumbnail.url !== undefined ) {
								item.css({'background-image': 'url('+ item_settings.thumbnail.url +')'});
								item.removeClass('atbb-has-no-thumb');
							}
						});
					break;
					//
					case 'slider':
						var controls = $('<ul/>',{'class': 'atbb-slider-gallery-controls'}).appendTo( content );
						content.addClass( 'atbb-slider-gallery' );
						$.each( settings['media-items'], function( i ) {
							var item_settings = this;
							var slide = $('<li/>',{'class': 'atbb-slider-gallery-item atbb-has-no-thumb'}).appendTo( content ).hide();
							if( item_settings.thumbnail !== undefined && item_settings.thumbnail.url !== undefined ) {
								$('<img/>',{ src: item_settings.thumbnail.url }).appendTo( slide );
								slide.removeClass('atbb-has-no-thumb');
							}

							var control_item = $('<li/>',{'class': 'atbb-slider-gallery-controls-item'}).appendTo( controls );

							if( parseInt(i, 10) === 0 ) {
								slide.show();
								control_item.addClass('atbb-slider-gallery-control-active');
							}
						});
					break;
				}

				//set the content
				widget.setContent( $('<div/>').append( content ).html() );

				//slider control functionality
				widget.content.off( 'click', '.atbb-slider-gallery-controls-item' );
				widget.content.on( 'click', '.atbb-slider-gallery-controls-item', function( e ) {
					e.preventDefault();
					if( $(this).hasClass('atbb-slider-gallery-control-active') ) {
						return false;
					}
					var index = $(this).index();
					widget.content.find('.atbb-slider-gallery-item').hide().eq( index ).show();
					//console.log( index );

					widget.content.find('.atbb-slider-gallery-controls-item').removeClass('atbb-slider-gallery-control-active');
					$(this).addClass('atbb-slider-gallery-control-active');
				});
			});
			//--------------------------------------------------------
		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var classes = ' ' + (settings['class'] ? settings['class'] : '');
			var layout_column_class = $('.atbb-layout-columns').children().has(widget).attr('class');

			if( settings['media-items'] === undefined ) { return output; }

			switch( settings.type ) {
				case 'grid':
					output += '<div class="atbb-grid-gallery-wrapper'+ classes +'">';
					var columns_class = 'atbb-grid-gallery-' + (settings.columns ? settings.columns : 3) + '-columns';
					var use_masonry_class = settings.use_masonry ? 'atbb-masonry-gallery' : '';

					output += '<ul class="atbb-grid-gallery '+ columns_class +' '+ use_masonry_class +'">';

					/* sizers */
					if( settings.use_masonry ) {
						output += '<li class="atbb-grid-gallery-grid-sizer"></li>';
						output += '<li class="atbb-grid-gallery-gutter-sizer"></li>';
					}
					/* ------ */

					$.each( settings['media-items'], function( i ) {
						var item_settings = this;
						var columns = parseInt((settings.columns ? settings.columns : 3), 10);
						var num = parseInt(i, 10) + 1;
						var title = item_settings.caption ? item_settings.caption : '';
						var image_src;
						var size = 'full';

						var video_width = item_settings.video_width ? item_settings.video_width : '640';
						var video_height = item_settings.video_height ? item_settings.video_height : '480';

						var target = item_settings.link_target === '_blank' ? '_blank' : '_self';
						var is_lightbox = item_settings.link_target === 'lightbox' ? '' : 'atbb-no-lightbox';

						if( columns === 2 ) {
							if( item_settings.thumbnail && item_settings.thumbnail.large ) {
								image_src = item_settings.thumbnail.large;
							} else if( item_settings.thumbnail && item_settings.thumbnail.url ) {
								image_src = item_settings.thumbnail.url;
							}
							size = 'large';
						} else if( columns === 3 ) {
							if( item_settings.thumbnail && item_settings.thumbnail.medium ) {
								image_src = item_settings.thumbnail.medium;
							} else if( item_settings.thumbnail && item_settings.thumbnail.url ) {
								image_src = item_settings.thumbnail.url;
							}
							size = 'medium';
						} else if( columns >= 4 ) {
							if( item_settings.thumbnail && item_settings.thumbnail.thumbnail ) {
								image_src = item_settings.thumbnail.thumbnail;
							} else if( item_settings.thumbnail && item_settings.thumbnail.url ) {
								image_src = item_settings.thumbnail.url;
							}
							size = 'medium';
						} else {
							if( item_settings.thumbnail && item_settings.thumbnail.url ) {
								image_src = item_settings.thumbnail.url;
							}
							size = 'full';
						}

						//console.log(item_settings);
						if( image_src !== undefined ) {
							output += (num % columns === 0 ? '<li class="atbb-gallery-item last">' : '<li class="atbb-gallery-item">');

							output += '<figure>';
							if( item_settings.link && item_settings.link.url ) {
								output += '<a href="'+ item_settings.link.url +'" class="'+ is_lightbox +'" target="'+ target +'" title="'+ title +'" data-dimension="'+video_width+'x'+video_height+'">';
								if( item_settings.thumbnail && item_settings.thumbnail.id ) {
									output += '[atbb_attachment id="'+ item_settings.thumbnail.id +'" size="'+ size +'" title="'+ title +'" url="'+item_settings.thumbnail.url+'" parent="grid-media-gallery" columns="'+columns+'" container="'+layout_column_class+'"/]';
								} else {
									output += '<img src="'+ image_src +'" title="'+ title +'" alt=""/>';
								}
								output += '</a>';
							} else if( image_src !== undefined ) {
								if( item_settings.thumbnail && item_settings.thumbnail.id ) {
									output += '[atbb_attachment id="'+ item_settings.thumbnail.id +'" size="'+ size +'" title="'+ title +'" url="'+item_settings.thumbnail.url+'" parent="grid-media-gallery" columns="'+columns+'" container="'+layout_column_class+'"/]';
								} else {
									output += '<img src="'+ image_src +'" title="'+ title +'" alt=""/>';
								}
							}
							output += '</figure>';
							output += '</li>';
						}
					});
					output += '</ul>';
					output += '</div>';
				break;
				//
				case 'slider':
					output += '<div class="atbb-slider-gallery-wrapper'+ classes +'">';
					
					var animation_type = settings.animation_type ? settings.animation_type : 'fade';
					var slideshow_speed = settings.slideshow_speed ? settings.slideshow_speed : 6;
					var animation_speed = settings.animation_speed ? settings.animation_speed : 0.6;
					var use_controls = settings.use_controls ? settings.use_controls : false;
					var use_paginate_controls = settings.use_paginate_controls ? settings.use_paginate_controls : false;
					var num_slides = 0;
					var size = 'full';

					output += '<ul class="atbb-slider-gallery" data-use-controls="'+ use_controls +'" data-use-pagination-controls="'+ use_paginate_controls +'" data-slideshow-speed="'+ slideshow_speed +'" data-animation-speed="'+ animation_speed +'" data-animation-type="'+ animation_type +'">';

					$.each( settings['media-items'], function( i ) {
						var item_settings = this;
						var title = item_settings.caption ? item_settings.caption : '';
						var image_src;
						var target = item_settings.link_target === '_blank' ? '_blank' : '_self';
						var is_lightbox = item_settings.link_target === 'lightbox' ? '' : 'atbb-no-lightbox';

						var video_width = item_settings.video_width ? item_settings.video_width : '640';
						var video_height = item_settings.video_height ? item_settings.video_height : '480';

						if( item_settings.thumbnail && item_settings.thumbnail.url ) {
							image_src = item_settings.thumbnail.url;
						}

						if( image_src !== undefined ) {
							if( parseInt(i, 10) === 0 ) {
								output += '<li class="atbb-slider-gallery-active-slide">';
							} else {
								output += '<li>';
							}
							if( item_settings.link && item_settings.link.url ) {
								output += '<a href="'+ item_settings.link.url +'" class="'+ is_lightbox +'" target="'+ target +'" title="'+ title +'" data-dimension="'+video_width+'x'+video_height+'">';
								if( item_settings.thumbnail && item_settings.thumbnail.id ) {
									output += '[atbb_attachment id="'+ item_settings.thumbnail.id +'" size="'+ size +'" title="'+ title +'" url="'+item_settings.thumbnail.url+'" parent="slider-media-gallery" container="'+layout_column_class+'"/]';
								} else {
									output += '<img src="'+ image_src +'" title="'+ title +'"/>';
								}
								output += '</a>';
							} else {
								if( item_settings.thumbnail && item_settings.thumbnail.id ) {
									output += '[atbb_attachment id="'+ item_settings.thumbnail.id +'" size="'+ size +'" title="'+ title +'" url="'+item_settings.thumbnail.url+'" parent="slider-media-gallery" container="'+layout_column_class+'"/]';
								} else {
									output += '<img src="'+ image_src +'" title="'+ title +'"/>';
								}
							}
							//caption
							if( item_settings.caption !== undefined ) {
								output += '<span class="atbb-slider-gallery-caption">';
								output += item_settings.caption;
								output += '</span>';
							}

							num_slides++;
							output += '</li>';
						}
					});
					output += '</ul>';
					//controls
					/*if( settings.use_controls ) {
						output += '<ul class="atbb-slider-gallery-controls">';
						for( var s = 0; s < num_slides; s++ ) {
							if( s === 0 ) {
								output += '<li class="atbb-slider-gallery-control-active"></li>';
							} else {
								output += '<li></li>';
							}
						}
						output += '</ul>';
					}*/
					output += '</div>';
				break;
			}

			
			return output;
		}
	});














	/* ========================================================================== */
	/* ========================================================================== */
	/* ==============================Post Content================================ */
	/* ========================================================================== */
	/* ========================================================================== */
	/*builder.widgets.PostContent = {
		title: 'Post Content',
		'class': 'post-content',

		editing: false,
		cloning: false,
		editor: function( widget ) {
			widget.on('onupdate', function() {
				var post_content = '';
				//console.log( tinymce.get('content') );
				if( window.tinymce && typeof tinymce.get === 'function' && tinymce.get('content') instanceof tinymce.Editor ) {
					var content_editor = tinymce.get( 'content' );
					post_content = content_editor.getContent();

					widget.setContent( post_content );
					widget.data( 'post_content', post_content );
				} else {
					post_content = $('#content').val();
					widget.setContent( post_content );
					console.log(post_content);
					widget.data( 'post_content', post_content );
				}
			});
		},
		output: function(  ) {
			//var settings = widget.getSettings();
			//var classes = ' ' + (settings['class'] ? settings['class'] : '');
			var output = ''; //must be a [String object]
			//var post_content = widget.data( 'post_content' );
			

			output += '<div class="atbb-post-content-block">';
			output += '##post_content##';
			output += '</div>';
			//console.log( 'outputing', widget.getSettings() );
			return output;
		}
	};*/








	/* ========================================================================== */
	/* ========================================================================== */
	/* ==================================Tabs==================================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Tabs', {
		title: 'Tabs',
		'class': 'tabs',

		editor: function( widget ) {
			widget.editor.title.text( 'Tabs Settings' );
			//----------------------
			$('<h2/>',{'class': 'atbb-widget-option-heading'}).text('Tabs').appendTo(widget.editor);
			$('<em/>').text('You may add tabs using the button above or clone exsiting ones and edit further. Tabs can be sorted and remove as well.').appendTo(widget.editor);
			//build the sortable container with 'tabs' as namespace
			var container = new widget.SortableContainer( '[tabs]' );
			container.appendTo( widget.editor );
			var settings = widget.getSettings();
			if( widget.settings.tabs ) {
				$.each(widget.settings.tabs, function( tg ) {
					if( widget.settings.tabs[tg] ) {
						addTabs( widget.settings.tabs[ tg ] );
					}
				});
			} else if( settings.tabs === undefined ) {
				addTabs( {label: '* Tab'} );
			}

			function addTabs( values ) {
				var tab = container.addGroup();
				var title = 'Tab';

				if( !values ) {
					values = {};
				}

				var label = tab.addOption({
					title: 'Tab Title',
					description: 'Set the title/label for the tab.',
					type: 'text',
					name: '[label]',
					value: values.label ? values.label : title
				});

				tab.title.text( values.label ? values.label : title );
				label.on('fieldchange', function( e, value ) {
					tab.title.text( value );
				});

				tab.addOption({
					title: 'Tab Content',
					description: 'Set content for this tab.',
					type: 'wp_editor',
					rows: 5,
					name: '[content]',
					value: values.content ? values.content : 'Sample content for a tab, change this to whatever you want.'
				});

				tab.onClone( addTabs );
				return tab;
			}

			var add_tab_button = new widget.editor.HeaderControl( 'fa-plus' );
				add_tab_button.setLabel( 'Add Tab' );
				add_tab_button.on('click', function( e ) {
					e.preventDefault();
					addTabs();
				});

			//--------------------------------------------------------
			var select = new widget.Option({
				title: 'Select The Active Tab',
				description: 'Select the tab you want to be active by default.',
				type: 'select',
				options: {},
				name: '[active]',
				value: widget.settings.active ? widget.settings.active : 0
			}).appendTo( widget.editor );

			widget.on('onupdate', function() {
				var settings = widget.getSettings();
				select.find('select').children('option').remove();
				if( settings.tabs !== undefined ) {
					$.each(settings.tabs, function( i ) {
						var tab_settings = this;
						var text = (parseInt(i, 10) + 1)+': ' + (tab_settings.label ? tab_settings.label : parseInt(i, 10) + 1);
						$('<option/>').attr({
							value: i
						}).text( text ).appendTo( select.find('select') );
					});
					select.find('select').val( widget.settings.active ? widget.settings.active : 0 );
					//console.log( settings.tabs );
				}
				//widget.setContent( settings.content ? settings.content : '' );
			});

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );




			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var active_tab = parseInt(settings.active, 10);

				widget.content.children().remove();

				var tab_box = $('<div/>', {'class': 'tab-box'});
				var btns = $('<ul/>', {'class': 'tab-btns'}).appendTo( tab_box );
					for( var b in settings.tabs ) {
						var btn_li = $('<li/>').appendTo( btns );
						var btn_a = $('<a/>').appendTo( btn_li );
						if( parseInt(b, 10) === active_tab ) {
							btn_li.addClass('active-tab');
						}
						btn_a.text( settings.tabs[b].label ? settings.tabs[b].label : '' );
					}
				var tabs = $('<ul/>', {'class': 'tabs'}).appendTo( tab_box );
					for( var t in settings.tabs ) {
						var tab_li = $('<li/>').appendTo( tabs );
						if( parseInt(t, 10) === active_tab ) {
							tab_li.addClass('active-tab');
						}
						tab_li.html( settings.tabs[t].content ? settings.tabs[t].content : '' );
					}

				widget.setContent( $('<div/>').append( tab_box ).html() );
				widget.content.find('.tab-btns').children().on('click', function( e ) {
					e.preventDefault();
					var contents = widget.content.find('.tabs').children();
						contents.removeClass('active-tab');
						contents.eq( $(this).index() ).addClass('active-tab');

					var buttons = widget.content.find('.tab-btns').children();
						buttons.removeClass('active-tab');
						$(this).addClass('active-tab');
				});
			});

		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var active_tab = parseInt(settings.active, 10);
			var classes = ' ' + (settings['class'] ? settings['class'] : '');

			if( settings.tabs !== undefined ) {
				output += '<div class="tab-box '+ classes +'">';
				output += '<ul class="tab-btns">';
					for( var b in settings.tabs ) {
						if( parseInt(b, 10) === active_tab ) {
							output += '<li class="active-tab">';
						} else {
							output += '<li>';
						}
						output += '<a href="#">'+ (settings.tabs[b].label ? settings.tabs[b].label : '') +'</a>';
						output += '</li>';
					}
				output += '</ul>';
				output += '<ul class="tabs">';
					for( var t in settings.tabs ) {
						if( parseInt(t, 10) === active_tab ) {
							output += '<li class="active-tab">';
						} else {
							output += '<li>';
						}
						output += settings.tabs[t].content ? settings.tabs[t].content : '';
						output += '</li>';
					}
				output += '</ul>';
				output += '</div>';
			}
			
			return output;
		}
	});












	/* ========================================================================== */
	/* ========================================================================== */
	/* ================================Toggles=================================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Toggles', {
		title: 'Toggles',
		'class': 'toggles',

		editor: function( widget ) {
			widget.editor.title.text( 'Toggles Settings' );
			//----------------------
			$('<h2/>',{'class': 'atbb-widget-option-heading'}).text('Toggles').appendTo(widget.editor);
			$('<em/>').text('You may add toggles using the button above or clone exsiting ones and edit further. Toggles can be sorted and remove as well.').appendTo(widget.editor);
			//build the sortable container with 'toggles' as namespace
			var container = new widget.SortableContainer( '[toggles]' );
			container.appendTo( widget.editor );
			var settings = widget.getSettings();
			if( widget.settings.toggles ) {
				$.each(widget.settings.toggles, function( tg ) {
					if( widget.settings.toggles[tg] ) {
						addToggles( widget.settings.toggles[ tg ] );
					}
				});
			} else if( settings.toggles === undefined ) {
				addToggles( {label: '* Toggle'} );
			}

			function addToggles( values ) {
				var toggle = container.addGroup();
				var title = 'Toggle';

				if( !values ) {
					values = {};
				}

				var label = toggle.addOption({
					title: 'Toggle Title',
					description: 'Set the title/label for the toggle.',
					type: 'text',
					name: '[label]',
					value: values.label ? values.label : title
				});

				toggle.title.text( values.label ? values.label : title );
				label.on('fieldchange', function( e, value ) {
					toggle.title.text( value );
				});

				toggle.addOption({
					title: 'Toggle Content',
					description: 'Set content for this toggle.',
					type: 'wp_editor',
					rows: 5,
					name: '[content]',
					value: values.content ? values.content : 'Sample content for a toggle, change this to whatever you want.'
				});

				toggle.onClone( addToggles );
				return toggle;
			}

			var add_toggle_button = new widget.editor.HeaderControl( 'fa-plus' );
				add_toggle_button.setLabel( 'Add Toggle' );
				add_toggle_button.on('click', function( e ) {
					e.preventDefault();
					addToggles();
				});

			//--------------------------------------------------------
			var select = new widget.Option({
				title: 'Select The Active Toggle',
				description: 'Select the toggle you want to be open by default.',
				type: 'select',
				options: {},
				name: '[active]',
				value: widget.settings.active ? widget.settings.active : 0
			}).appendTo( widget.editor );

			widget.on('onupdate', function() {
				var settings = widget.getSettings();
				select.find('select').children('option').remove();
				if( settings.toggles !== undefined ) {
					$.each(settings.toggles, function( i ) {
						var toggle_settings = this;
						var text = (parseInt(i, 10) + 1)+': ' + (toggle_settings.label ? toggle_settings.label : parseInt(i, 10) + 1);
						$('<option/>').attr({
							value: i
						}).text( text ).appendTo( select.find('select') );
					});
					select.find('select').val( widget.settings.active ? widget.settings.active : 0 );
					//console.log( settings.toggles );
				}
				//widget.setContent( settings.content ? settings.content : '' );
			});

			//--------------------------------------------------------
			new widget.Option({
				title: 'The Type',
				description: 'Set the type to either Toggle or Accordion.',
				type: 'select',
				options: {
					'': 'Toggle',
					'accordion': 'Accordion'
				},
				name: '[type]',
				value: widget.settings.type ? widget.settings.type : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );



			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var active_toggle = parseInt(settings.active, 10);

				widget.content.children().remove();

				var toggles = $('<ul/>', {'class': 'toggle'});
					for( var t in settings.toggles ) {
						var toggle_li = $('<li/>').appendTo( toggles );
						var label = $('<a/>').appendTo( toggle_li );

						if( parseInt(t, 10) === active_toggle ) {
							toggle_li.addClass('open');
						}
						label.text( settings.toggles[t].label ? settings.toggles[t].label : '' );

						var content = $('<div/>', {'class': 'toggle-item-content'}).appendTo( toggle_li );
						content.html( settings.toggles[t].content ? settings.toggles[t].content : '' );
					}

				if( settings.type ) {
					toggles.addClass( settings.type );
				}

				widget.setContent( $('<div/>').append( toggles ).html() );
				
				widget.content.find('ul.toggle>li>a').on('click', function(e) {
					e.preventDefault();
					var container = widget.content.find('ul.toggle');
					if( container.hasClass('accordion') ) {
						widget.content.find('.toggle>li').removeClass('open');
						$(this).parent().addClass('open');
					} else {
						$(this).parent().toggleClass('open');
					}
				});
			});


		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var active_toggle = parseInt(settings.active, 10);
			var classes = ' ' + (settings['class'] ? settings['class'] : '');

			if( settings.toggles !== undefined ) {
				output += '<ul class="toggle '+ (settings.type ? settings.type : '') +' '+ classes +'">';
					for( var t in settings.toggles ) {
						if( parseInt(t, 10) === active_toggle ) {
							output += '<li class="open">';
						} else {
							output += '<li>';
						}
						output += '<a href="#">'+ (settings.toggles[t].label ? settings.toggles[t].label : '') +'</a>';
						output += '<div class="toggle-item-content">';
						output += settings.toggles[t].content ? settings.toggles[t].content : '';
						output += '</div>';
						output += '</li>';
					}
				output += '</ul>';
			}
			
			return output;
		}
	});



















	/* ========================================================================== */
	/* ========================================================================== */
	/* ===============================Services Block================================= */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget('ServicesBlock', {
		title: 'Service Block', //This will be shown in the "Widget Selection" window.
		'class': 'services-block', //this will be prefixed with "atbb-widget-selector-" so the complete class will look like "atbb-widget-selector-text-block"

		//.editor method is ran when the "BoxBulder" is executing the creation of widgets and builds the editors for those.
		editor: function( widget ) {
			widget.editor.title.text( 'Service Block Widget Settings' );
			//console.log( widget.namespace );

			new widget.Option({
				title: 'Icon',
				description: 'Select an icon for the services block.',
				type: 'icon',
				name: '[icon]',
				value: widget.settings.icon ? widget.settings.icon : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Icon Link',
				description: 'Set a link for the icon.',
				type: 'text',
				name: '[icon_link]',
				value: widget.settings.icon_link ? widget.settings.icon_link : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Icon Link Target',
				description: 'Select the window behavior of the link.',
				type: 'select',
				options: {
					'_blank': 'New Window / Tab',
					'_self': 'Same WIndow / Tab'
				},
				name: '[icon_link_target]',
				value: widget.settings.icon_link_target ? widget.settings.icon_link_target : '_blank'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Content',
				description: 'Set the content for this services block.',
				type: 'mce',
				rows: 6,
				name: '[content]',
				value: widget.settings.content ? widget.settings.content : 'Sample content for the "Text Block Widget".'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Content Alignment',
				description: 'Select the alignment for the icon and the text.',
				type: 'select',
				options: {
					'left': 'Left',
					'center': 'Center',
					'right': 'Right'
				},
				name: '[alignment]',
				value: widget.settings.alignment ? widget.settings.alignment : 'center'
			}).appendTo( widget.editor );


			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );

			
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				//console.log( settings );
				var alignment = 'atbb-services-block-align-' + (settings.alignment ? settings.alignment : 'center');
				var content = $('<div/>', {'class': alignment}).html( settings.content ? settings.content : '' );
				if( settings.icon !== undefined ) {
					$('<span/>', {'class': 'fa atbb-services-block-icon'}).html('&#x'+ settings.icon +';').prependTo( content );
				}

				widget.setContent( $('<div/>').append( content ).html() );
			});
		},
		//this function is being ran on every widget when the user saves or updates the post. This builds the HTML/output that must be added in the content on the front-end. Note that this can output shortcodes as well as contian both html and shortcodes.
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var classes = ' ' + (settings['class'] ? settings['class'] : '');
			var target = settings.icon_link_target ? settings.icon_link_target : '_blank';
			var alignment = 'atbb-services-block-align-' + (settings.alignment ? settings.alignment : 'center');

			output += '<div class="atbb-services-block'+ classes +' '+ alignment +'">';
			if( settings.icon !== undefined ) {
				if( settings.icon_link !== undefined ) {
					output += '<a href="'+ settings.icon_link +'" class="fa atbb-services-block-icon" target="'+target+'">&#x'+settings.icon+';</a>';
				} else {
					output += '<span class="fa atbb-services-block-icon">&#x'+settings.icon+';</span>';
				}
				
			}
			output += '<div class="atbb-services-block-content">';
			output += settings.content ? settings.content : '';
			output += '</div>';
			output += '</div>';
			
			return output;
		}
	});

































	/* ========================================================================== */
	/* ========================================================================== */
	/* ===============================Message Box================================ */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'MessageBox', {
		title: 'Message Box',
		'class': 'message-box',

		editor: function( widget ) {
			widget.editor.title.text( 'Message Box Settings' );
			//console.log( widget.namespace );

			new widget.Option({
				title: 'Message Content',
				description: 'Set the content for this message.',
				type: 'mce',
				rows: 6,
				name: '[content]',
				value: widget.settings.content ? widget.settings.content : 'Sample content for the "Message Box Widget".'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Message Type',
				description: 'Set the type for the message.',
				type: 'select',
				options: {
					'notification': 'Notification',
					'warning': 'Warning',
					'success': 'Success',
					'error': 'Error'

				},
				name: '[type]',
				value: widget.settings.type ? widget.settings.type : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var content = $('<div/>', {'class': 'message-box'}).html( settings.content ? settings.content : '' );
				if(  settings.type !== undefined ) {
					content.addClass( settings.type );
				}
				widget.setContent( $('<div/>').append( content ).html() );
			});
		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var classes = settings['class'] ? settings['class'] : '';

			output += '<div class="message-box '+ (settings.type ? settings.type : '') +' '+ classes +'">';
			output += settings.content ? settings.content : '';
			output += '</div>';

			return output;
		}
	});





















	/* ========================================================================== */
	/* ========================================================================== */
	/* ================================Separator================================= */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Separator', {
		title: 'Separator',
		'class': 'separator',
		editor: function( widget ) {
			widget.editor.title.text( 'Separator Settings' );
			//console.log( widget.namespace );

			new widget.Option({
				title: 'Separator Title',
				description: 'Set the title for separator.',
				type: 'text',
				name: '[title]',
				value: widget.settings.title ? widget.settings.title : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Title Alignment',
				description: 'Select one of the three alignments. Left, Right and Center',
				type: 'select',
				options: {
					'align-left': 'Left',
					'align-right': 'Right',
					'align-center': 'Center'
				},
				name: '[align]',
				value: widget.settings.align ? widget.settings.align : 'align-left'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Title Format',
				description: 'Set a format for the title.',
				type: 'select',
				options: {
					'p': 'Paragraph',
					'h1': 'H1 Heading',
					'h2': 'H2 Heading',
					'h3': 'H3 Heading',
					'h4': 'H4 Heading',
					'h5': 'H5 Heading',
					'h6': 'H6 Heading'
				},
				name: '[foramt]',
				value: widget.settings.foramt ? widget.settings.foramt : 'h4'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var format = settings.foramt ? settings.foramt : 'h4';
				var alignment = settings.align ? settings.align : 'align-left';

				var classes = settings['class'] ? settings['class'] : '';
				var content = $('<div/>', {'class': classes});

				$('<'+ format +'/>', {'class': alignment }).html( settings.title ? settings.title : '' ).appendTo(content);
				$('<hr/>').appendTo(content);

				widget.setContent( $('<div/>').append( content ).html() );
			});
		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var format = settings.foramt ? settings.foramt : 'h4';
			var alignment = settings.align ? settings.align : 'align-left';
			var title = settings.title ? settings.title : false;
			var classes = settings['class'] ? settings['class'] : '';

			output += '<div class="atbb-separator ' + classes + '">';
			if( title ) {
				output += '<'+ format +' class="'+ alignment +'">';
				output += title;
				output += '</'+ format +'>';
			}
			output += '<hr>';
			output += '</div>';
			//console.log( 'outputing', widget.getSettings() );
			return output;
		}
	});















	/* ========================================================================== */
	/* ========================================================================== */
	/* ================================Dropcap=================================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Dropcap', {
		title: 'Dropcap',
		'class': 'dropcap',
		editor: function( widget ) {
			widget.editor.title.text( 'Dropcap Settings' );
			//console.log( widget.namespace );

			new widget.Option({
				title: 'Content',
				description: 'Set the content for this dropcap.',
				type: 'mce',
				rows: 6,
				name: '[content]',
				value: widget.settings.content ? widget.settings.content : 'Sample content for the a "Dropcap Widget". Duis autem vel eum iriure dolor in hendrerit in vulputate.'
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Dropcap Style',
				description: 'Set a format for the title.',
				type: 'select',
				options: {
					'': 'Default',
					'round': 'Circle',
					'square': 'Square'
				},
				name: '[style]',
				value: widget.settings.style ? widget.settings.style : ''
			}).appendTo( widget.editor );

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var style = settings.style ? settings.style : '';

				var element = $('<div/>').html( settings.content ? settings.content : '' );
				var text = element.text();

				var word = text.split(' ')[0];
				var letter = word.substr(0, 1);
				var	new_word = word.substr(1);

				var new_string = settings.content.replace( word, new_word );
				var first_letter = '<span class="first-letter">'+letter+'</span>';

				var html = first_letter + new_string;

				var content = $('<div/>', {'class': 'drop-cap'}).addClass( style ).html( html );
				var classes = settings['class'] ? settings['class'] : '';
					content.addClass(classes);

				widget.setContent( $('<div/>').append( content ).html() );
			});
		},
		output: function( widget ) {
			var output = ''; //must be a [String object]
			var settings = widget.getSettings();
			var style = settings.style ? settings.style : '';
			var classes = settings['class'] ? settings['class'] : '';

			if( !settings.content ) return output;

			var content_element = $('<div/>', {'class': 'atbb-dropcap-content-wrap'}).html( settings.content );
			//var text_elem = content_element.eq(0);
			//var text = text_elem.text();

			output += '<div class="drop-cap '+ style +' '+ classes +'">';

			if( settings.content ) {
				var element = $('<div/>').html( settings.content );
				var text = element.text();

				var word = text.split(' ')[0];
				var letter = word.substr(0, 1);
				var	new_word = word.substr(1);

				var new_string = settings.content.replace( word, new_word );
				var first_letter = '<span class="first-letter">'+letter+'</span>';

				var html = first_letter + new_string;

				output += html;

				//console.log(html);
			}

			output += '</div>';

			//console.log( 'outputing', output );
			return output;
		}
	});
















	/* ========================================================================== */
	/* ========================================================================== */
	/* ==================================Break=================================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Break', {
		title: 'Break',
		'class': 'break',

		editing: false,
		editor: function() {
			
		},
		output: function() {
			var output = ''; //must be a [String object]
			output += '<div class="break"></div>';
			//console.log( 'outputing', widget.getSettings() );
			return output;
		}
	});
















	/* ========================================================================== */
	/* ========================================================================== */
	/* ==================================SKILLS================================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'Skills', {
		title: 'Skills',
		'class': 'skills',
		editor: function( widget ) {
			widget.editor.title.text( 'Skills Settings' );
			//----------------------
			$('<h2/>',{'class': 'atbb-widget-option-heading'}).text('Skills').appendTo(widget.editor);
			$('<em/>').text('You may add skills using the button above or clone exsiting ones and edit further. Skills can be sorted and remove as well.').appendTo(widget.editor);
			//build the sortable container with 'toggles' as namespace
			var container = new widget.SortableContainer( '[skills]' );
			container.appendTo( widget.editor );
			var settings = widget.getSettings();
			if( widget.settings.skills ) {
				$.each(widget.settings.skills, function( tg ) {
					if( widget.settings.skills[tg] ) {
						addSkills( widget.settings.skills[ tg ] );
					}
				});
			} else if( settings.skills === undefined ) {
				addSkills( {label: '* Skill'} );
			}

			function addSkills( values ) {
				var skill = container.addGroup();
				var title = 'Skill';

				if( values === undefined ) {
					values = {};
				}

				var label = skill.addOption({
					title: 'Skill Title',
					description: 'Set the title/label for the skill.',
					type: 'text',
					name: '[label]',
					value: values.label ? values.label : title
				});

				skill.title.text( values.label ? values.label : title );
				label.on('fieldchange', function( e, value ) {
					skill.title.text( value );
				});

				skill.addOption({
					title: 'Proficiency Level',
					description: 'Set the level of proficiency for this skill (in percents).',
					type: 'number',
					name: '[level]',
					min: 0,
					max: 100,
					value: values.level !== undefined ? values.level : 0
				});

				skill.onClone( addSkills );
				return skill;
			}

			var add_skill_button = new widget.editor.HeaderControl( 'fa-plus' );
				add_skill_button.setLabel( 'Add Skill' );
				add_skill_button.on('click', function( e ) {
					e.preventDefault();
					addSkills();
				});

			//--------------------------------------------------------
			widget.on('onupdate', function() {

			});
			//--------------------------------------------------------

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var content = $('<ul/>', {'class': 'atbb-skills'});

				if( settings.skills !== undefined ) {
					for( var s in settings.skills ) {
						var skill = settings.skills[s];
						var skill_li = $('<li/>').appendTo( content );
						$('<span/>', {'class': 'atbb-skill-title'}).appendTo( skill_li ).html( skill.label !== undefined ? skill.label : '');
						$('<span/>', {'class': 'atbb-skill-level'}).css({
							width: (skill.level !== undefined ? skill.level : 0) + '%'
						}).appendTo( skill_li );
					}
				}

				widget.setContent( $('<div/>').append( content ).html() );
			});
		},
		output: function( widget ) {
			var settings = widget.getSettings();
			var classes = settings['class'] ? settings['class'] : '';
			var output = ''; //must be a [String object]
			output += '<ul class="atbb-skills '+ classes +'">';
			if( settings.skills !== undefined ) {
				for( var s in settings.skills ) {
					var skill = settings.skills[s];
					output += '<li>';
					output += '<span class="atbb-skill-title">'+ (skill.label !== undefined ? skill.label : '') +'</span>';
					output += '<span class="atbb-skill-level" style="width: '+ (skill.level !== undefined ? skill.level : 0) +'%;"><!--emptytagfix--></span>';
					output += '</li>';
				}
			}
			output += '</ul>';
			//console.log( 'outputing', widget.getSettings() );
			return output;
		}
	});
























	/* ========================================================================== */
	/* ========================================================================== */
	/* ===============================TEAM MEMBERS=============================== */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'TeamMembers', {
		title: 'Team Members',
		'class': 'team-members',
		editor: function( widget ) {
			widget.editor.title.text( 'Team Members Settings' );
			//----------------------
			$('<h2/>',{'class': 'atbb-widget-option-heading'}).text('Team Members').appendTo(widget.editor);
			$('<em/>').text('You may add team members using the button above or clone exsiting ones and edit further. Team Members can be sorted and remove as well.').appendTo(widget.editor);
			//build the sortable container with 'toggles' as namespace
			var container = new widget.SortableContainer( '[team-members]' );
			container.appendTo( widget.editor );
			var settings = widget.getSettings();
			if( widget.settings['team-members'] ) {
				$.each(widget.settings['team-members'], function( tg ) {
					if( widget.settings['team-members'][tg] ) {
						addTeamMember( widget.settings['team-members'][ tg ] );
					}
				});
			} else if( settings['team-members'] === undefined ) {
				addTeamMember( {label: '* Team Member'} );
			}

			function addTeamMember( values ) {
				var team_member = container.addGroup();
				var title = 'Team Member';

				if( values === undefined ) {
					values = {};
				}

				//thumbnail
				team_member.addOption({
					title: 'Thumbnail',
					description: 'select an image for the team member.',
					type: 'media',
					name: '[thumbnail]',
					value: values.thumbnail ? values.thumbnail : ''
				});

				var label = team_member.addOption({
					title: 'Team Member Name',
					description: 'Set the team member\'s name.',
					type: 'text',
					name: '[label]',
					value: values.label ? values.label : ''
				});

				team_member.addOption({
					title: 'Job Title',
					description: 'Set the job title for this team member.',
					type: 'text',
					name: '[job]',
					placeholder: 'Exp: Web Designer',
					value: values.job ? values.job : ''
				});

				team_member.addOption({
					title: 'Description',
					description: 'Write some descripption for this team member.',
					type: 'wp_editor',
					rows: 4,
					name: '[description]',
					value: values.description ? values.description : ''
				});

				team_member.title.text( values.label ? values.label : title );
				label.on('fieldchange', function( e, value ) {
					team_member.title.text( value );
				});

				team_member.onClone( addTeamMember );
				return team_member;
			}

			var add_team_member_button = new widget.editor.HeaderControl( 'fa-plus' );
				add_team_member_button.setLabel( 'Add Team Member' );
				add_team_member_button.on('click', function( e ) {
					e.preventDefault();
					addTeamMember();
				});


			new widget.Option({
				title: 'Type',
				description: 'Select the type of Team Members widget.',
				type: 'select',
				options: {
					'slider': 'Slider',
					'grid': 'Grid'
				},
				name: '[type]',
				value: widget.settings.type ? widget.settings.type : 'slider'
			}).appendTo(widget.editor);


			new widget.Option({
				title: 'Columns',
				description: 'Select the number of team members that will be visible before directional naviagtion will be added.',
				type: 'select',
				options: {
					'2': '2',
					'3': '3',
					'4': '4'
				},
				name: '[columns]',
				value: widget.settings.columns ? widget.settings.columns : '3'
			}).appendTo(widget.editor);

			//--------------------------------------------------------
			widget.on('onupdate', function() {

			});
			//--------------------------------------------------------

			new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );


			//on save update the content/preview of the widget
			widget.on('onsave', function() {
				var settings = widget.getSettings();
				var columns = settings.columns ? settings.columns : 3;
				var content = $('<div/>', {'class': 'atbb-team-members-wrapper'});

				var margin = 2;
				var cont_width = 100 - (margin * (columns - 1));
				var width = Math.round( (cont_width / columns) * 100 ) / 100;

				var ul = $('<ul/>', {'class': 'atbb-team-members'}).addClass('atbb-team-members-columns-' + columns).appendTo( content );
				if( settings['team-members'] !== undefined ) {
					for( var t in settings['team-members'] ) {
						var team_member = settings['team-members'][t];

						var member = $('<li/>').appendTo( ul );
						var thumb = $('<div/>', {'class': 'atbb-team-member-thumbnail'}).appendTo( member );

						if( team_member.thumbnail && team_member.thumbnail.medium ) {
							$('<div/>', {'class': 'atbb-team-member-thumb-bg'}).appendTo(thumb).css({
								'background-image': 'url(' + team_member.thumbnail.medium + ')'
							}).appendTo(thumb);
						} else if( team_member.thumbnail && team_member.thumbnail.large ) {
							$('<div/>', {'class': 'atbb-team-member-thumb-bg'}).appendTo(thumb).css({
								'background-image': 'url(' + team_member.thumbnail.large + ')'
							}).appendTo(thumb);
						} else if( team_member.thumbnail && team_member.thumbnail.url ) {
							$('<div/>', {'class': 'atbb-team-member-thumb-bg'}).appendTo(thumb).css({
								'background-image': 'url(' + team_member.thumbnail.url + ')'
							}).appendTo(thumb);
						}

						//console.log(team_member);

						$('<div/>', {'class': 'atbb-team-member-name'}).appendTo( member ).html(team_member.label ? team_member.label : '');
						$('<div/>', {'class': 'atbb-team-member-job'}).appendTo( member ).html(team_member.job ? team_member.job : '');
						$('<div/>', {'class': 'atbb-team-member-description'}).appendTo( member ).html(team_member.description ? team_member.description : '');

						var left = ( width + margin ) * parseInt(t, 10);

						member.css({
							width: width + '%',
							left: left + '%'
						});

						if( parseInt(t, 10) > 0 ) {
							//poses.unshift( 0 - left );
						}
					}

					$('<span/>', {'class': 'atbb-team-members-prev fa fa-chevron-left'}).appendTo( content );
					$('<span/>', {'class': 'atbb-team-members-next fa fa-chevron-right'}).appendTo( content );
				}
				widget.setContent( $('<div/>').append( content ).html() );

				
				
				widget.on('oncontent', function(){
					var lis = widget.content.find('.atbb-team-members>li').hide();
					var heights = 0;
					lis.each(function() {
						var li = $(this);
						li.show();

						if( li.height() >= heights ) {
							heights = li.height();
							widget.content.find('.atbb-team-members').css({
								height: heights
							});
						}
						//console.log(li.parent().css('display'));
					});
				});


				var lis = widget.content.find('.atbb-team-members>li').hide();
				var max = Math.ceil(lis.length / columns);
				var current = 0;

				widget.content.find('.atbb-team-members-prev').on('click', function() {
					if( current > 0 ) {
						current--;
						var ul = widget.content.find('.atbb-team-members');
						var x = parseInt( lis.eq(0).width() + (ul.width() * margin / 100), 10 ) * current;
						/*lis.each(function(i) {
							$(this).delay( 100 * ((lis.length-1) - i) ).transition({
								'x': 0 - (x * columns)
							});
						});*/
						lis.each(function() {
							$(this).transition({
								'x': 0 - (x * columns)
							}, 500, 'ease');
						});
					}
				});

				widget.content.find('.atbb-team-members-next').on('click', function() {
					if( current + 1 < max ) {
						current++;
						var ul = widget.content.find('.atbb-team-members');
						var x = parseInt( lis.eq(0).width() + (ul.width() * margin / 100), 10 ) * current;
						/*lis.each(function(i) {
							$(this).delay( 100 * i ).transition({
								'x': 0 - (x * columns)
							});
						});*/
						lis.each(function() {
							$(this).transition({
								'x': 0 - (x * columns)
							}, 500, 'ease');
						});
					}
				});
			});
		},
		output: function( widget ) {
			var settings = widget.getSettings();
			var classes = settings['class'] ? settings['class'] : '';
			var output = ''; //must be a [String object]
			var type = settings.type ? settings.type : 'slider';
			var columns = settings.columns ? settings.columns : 3;
			var count = 0;

			var layout_column_class = $('.atbb-layout-columns').children().has(widget).attr('class');

			if( settings['team-members'] !== undefined ) {
				output += '<div class="atbb-team-members-wrapper atbb-team-members-'+ type +' '+ classes +'">';

				if( type === 'slider' ) {
					output += '<ul class="atbb-team-members atbb-team-members-columns-'+columns+'" data-columns="'+columns+'">';
				} else {
					output += '<ul class="atbb-team-members atbb-grid-gallery-'+columns+'-columns atbb-grid-gallery atbb-masonry-gallery" data-columns="'+columns+'">';
				}
				
				for( var t in settings['team-members'] ) {
					var team_member = settings['team-members'][t];
					var name = team_member.label ? team_member.label : '';
					var job = team_member.job ? team_member.job : '';
					var desc = team_member.description ? team_member.description : '';
					var thumb = '';
					var thumb_id = team_member.thumbnail && team_member.thumbnail.id ? team_member.thumbnail.id : 0;

					if( team_member.thumbnail && team_member.thumbnail.large ) {
						thumb = team_member.thumbnail.large;
					} else if( team_member.thumbnail && team_member.thumbnail.url ) {
						thumb = team_member.thumbnail.url;
					}

					output += '<li><div class="atbb-team-member-wrapepr">';
					if( thumb !== '' ) {
						output += '<figure class="atbb-team-member-thumbnail">';
						//output += '<img src="'+ thumb +'" alt="'+ name +'"/>';
						output += '[atbb_attachment id="'+thumb_id+'" size="full" parent="team-member" columns="'+columns+'" container="'+layout_column_class+'"/]';
						output += '</figure>';
					}

					var trimed_desc = desc.replace(/(<([^>]+)>)/ig,'').trim();

					output += name !== '' || job !== '' || trimed_desc !== '' ? '<div class="atbb-team-member-details">' : '';
					output += name !== '' ? '<div class="atbb-team-member-name">'+name+'</div>' : '';
					output += job !== '' ? '<div class="atbb-team-member-job">'+job+'</div>' : '';
					//console.log(desc);
					output += trimed_desc !== '' ? '<div class="atbb-team-member-description">'+desc+'</div>' : '';
					//console.log(desc);
					output += name !== '' || job !== '' || trimed_desc !== '' ? '</div>' : '';
					output += '</div></li>';
					count++;
				}
				output += '</ul>';
				if( count > columns ) {
					//output += '<span class="atbb-team-members-prev fa fa-chevron-left"></span><span class="atbb-team-members-next fa fa-chevron-right"></span>';
				}
				output += '</div>';
			}
			return output;
		}
	});



















	/* ========================================================================== */
	/* ========================================================================== */
	/* ===============================Search Form================================ */
	/* ========================================================================== */
	/* ========================================================================== */
	new BoxBuilderWidget( 'SearchForm', {
		title: 'Search Form',
		'class': 'search-form',

		editing: false,
		cloning: false,
		editor: function( widget ) {

			/*new widget.Option({
				title: 'Additional CSS Class',
				description: 'This option puts the content into an additional element and applies the class-name set below, allowing you to apply specific styling via CSS.',
				type: 'text',
				name: '[class]',
				value: widget.settings['class'] ? widget.settings['class'] : '',
				placeholder: 'Example: awesome-css-class'
			}).appendTo( widget.editor );

			widget.on('onupdate', function() {
				
			});*/
		},
		output: function( widget ) {
			var settings = widget.getSettings();
			//var classes = ' ' + (settings['class'] ? settings['class'] : '');
			var output = ''; //must be a [String object]
			//var post_content = widget.data( 'post_content' );
			

			output += '<div class="atbb-search-form">';
			output += '[atbb_search_form/]';
			output += '</div>';
			//console.log( 'outputing', widget.getSettings() );
			return output;
		}
	});
	




})(jQuery);