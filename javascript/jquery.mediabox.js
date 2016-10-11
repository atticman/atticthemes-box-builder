/* global jQuery:false, console:false */
/* jshint -W098 */

(function($) {
	'use strict';
	if( window.MediaBox !== undefined ) {
		return;
	}
	
	if ( !$.support.transition || $().transition === undefined ) {
		$.fn.transition = $.fn.animate;
	}

	window.MediaBox = function( settings ) {
		//defining element
		var direction = 'next';
		var box  = {
			version: '2.0.3',
			stack: [],
			current: 0,
			previous: 0,
			element: 'a.mediabox',
			gallery: '.media-gallery',
			exclude: '.no-lightbox',
			duration: 500,
			shift: 25,
			easing: 'linear',
			is_open: false,
			storage: {},
			transit_support: false,
			is_animating: false,
			_queue: [],
			init: function() {
				box.cotainer = $('<div/>').hide().attr('id', 'mediabox-window').addClass('mediabox-window');
				var background = $('<div/>').addClass('mediabox-background').appendTo(box.cotainer);

				box.preloader = $('<span/>').addClass('mediabox-preloader').appendTo(box.cotainer).hide();

				box.controls = $('<div/>').addClass('mediabox-controls').appendTo(box.cotainer);
					box.controls.prev = $('<a/>').addClass('mediabox-prev').appendTo(box.controls);
					box.controls.close = $('<a/>').addClass('mediabox-close').appendTo(box.controls);
					box.controls.next = $('<a/>').addClass('mediabox-next').appendTo(box.controls);

				var title_holder = $('<div/>').addClass('mediabox-title').appendTo(box.cotainer);
					box.title = $('<div/>').addClass('mediabox-title-wrapper').appendTo(title_holder).hide();

				var media_holder = $('<div/>').attr('id', 'mediabox-media').addClass('mediabox-media').appendTo(box.cotainer);
					box.media = $('<div/>').addClass('mediabox-media-wrapper').appendTo(media_holder);
					box.bg_closer = $('<div/>').addClass('mediabox-background-closer').appendTo(box.media);

				$('body').append(box.cotainer);

				box.storage.element = box.getElementsString();
				box.storage.gallery = box.getGalleriesString();

				box.transit_support = !$.support.transition || $().transition === undefined ? false : true;
			},
			next: function() {
				if( box.current < box.stack.length-1 ) {
					box.previous = box.current;
					box.current++;
					box.queue();
				}
			},
			prev: function() {
				if( box.current > 0 ) {
					box.previous = box.current;
					box.current--;
					box.queue();
				}
			},
			queue: function() {
				var obj = box.stack[box.current];
				box._queue.push( obj );

				if( box._queue.length === 1 ) {
					box.load( box._queue[0] );
				}
			},
			load: function( obj ) {
				box.open();
				box.before();
				box.slideOut( function() {
					//console.log( box._queue.length,box.current );

					if( box._queue.length > 1 ) {
						var last = box.stack[box.current];
						box._queue = [];
						box._queue.push(last);
						
						box.load(box._queue[0]);
						return;
					}

					if( obj.title !== undefined ) {
						box.setTitle( obj.title );
					} else {
						box.setTitle( '' );
					}
					for( var t in box.types ) {
						var object = box.types[t]( obj.url, obj.attrs );
						if( object ) {
							box.push( object.attr( obj.attrs ) );
							break;
						}
					}
					
					box._queue = [];
				});
				//console.log(box.stack);
			},
			push: function( media ) {
				function adjustMedia() {
					if( media && media.jquery ) {
						media.css({
							'max-height': $(window).height() - 40
						});
					}
				}

				if( media && media.jquery ) {
					adjustMedia();
					box.cotainer.off('mediabox.resize', adjustMedia );
					box.cotainer.on('mediabox.resize', adjustMedia );

					box.media.children().not('.mediabox-background-closer').remove();
					box.media.append( media );
					if( media.is('img') || media.is('iframe') ) {
						media.load( function() {
							box.checkDirectionNav();
							box.slideIn();
						});
					} else {
						box.checkDirectionNav();
						box.slideIn();
					}
					//console.log(media);
				}
			},
			open: function() {
				//console.log(box.stack);
				if( box.stack.length === 0 ) {
					box.hideDirectionNav();
				} else {
					box.showDirectionNav();
				}

				//console.log( box.is_open );
				if( !box.is_open ) {
					box.media.children().not('.mediabox-background-closer').remove();
					//box.title.empty().hide();

					box.cotainer.css({
						opacity: 0
					}).show().transition({
						opacity: 1
					}, box.duration, box.easing);

					box.is_open = true;
				}

				applyTouchGestures();
			},
			close: function() {
				//console.log(box.cotainer);
				box._queue = [];
				box.cotainer.css({
					opacity: 1
				}).show().transition({
					opacity: 0
				}, box.duration, box.easing, function() {
					box.cotainer.css({
						opacity: 0
					}).hide();
				});

				box.current = 0;
				box.previous = 0;
				box.stack = [];
				box.is_open = false;
				box.unload();

				box.title.transition({
					opacity: 0,
					//queue: false
				}, box.duration, box.easing, function() {
					$(this).hide();
				});

				destroyTouchGestures();
			},
			slideOut: function( oncomplete ) {
				box.media.transition({
					opacity: 0,
					x: box.getDirection() === 'next' ? 0 - parseInt(box.shift, 10) : parseInt(box.shift, 10),
					left: !box.transit_support ? box.getDirection() === 'next' ? 0 - parseInt(box.shift, 10) : parseInt(box.shift, 10) : 'auto'
				}, box.duration, box.easing, function() {
					box.preloader.fadeIn('fast');
					if( oncomplete ) {
						oncomplete();
					}
				});

				box.title.transition({
					opacity: 0,
					//queue: false
				}, box.duration, box.easing, function() {
					$(this).hide();
				});

				//console.log(box.getDirection());
			},
			slideIn: function() {
				box.preloader.fadeOut({
					complete: function() {
						box.media.css({
							opacity: 0,
							x: box.getDirection() === 'next' ? parseInt(box.shift, 10) : 0 - parseInt(box.shift, 10),
							left: !box.transit_support ? box.getDirection() === 'next' ? parseInt(box.shift, 10) : 0 - parseInt(box.shift, 10) : 'auto'
						}).transition({
							opacity: 1,
							x: 0,
							left: !box.transit_support ? 0 : 'auto'
						}, box.duration, box.easing, function() {
							box.after();
						});

						if( box.title.text().trim() !== '' ) {
							box.title.css({
								opacity: 0
							}).show().transition({
								opacity: 1
								//queue: false
							}, box.duration, box.easing);
						}
						
						
						if( !box.is_open ) {
							box.current = 0;
							box.previous = 0;
							box.stack = [];
							box.media.children().not('.mediabox-background-closer').remove();
						}
						
					}//END complete
				});
				
				//console.log(box.getDirection());
			},
			setTitle: function( title ) {
				if( title !== undefined ) {
					box.title.html( title );
				}
			},
			hideDirectionNav: function() {
				box.controls.prev.hide();
				box.controls.next.hide();
			},
			showDirectionNav: function() {
				box.controls.prev.show();
				box.controls.next.show();
			},
			checkDirectionNav: function() {
				if( box.current > 0 ) {
					box.controls.prev.removeClass('mediabox-hidden-control');
				} else {
					box.controls.prev.addClass('mediabox-hidden-control');
				}
				if( box.current < box.stack.length-1 ) {
					box.controls.next.removeClass('mediabox-hidden-control');
				} else {
					box.controls.next.addClass('mediabox-hidden-control');
				}
			},
			getDirection: function() {
				var direction = 'next';
				if( box.current < box.previous ) {
					direction = 'prev';
				}
				return direction;
			},
			getGalleriesString: function() {
				var galleries = box.gallery.split(',');
				for(var i = 0; i < galleries.length; i++) {
					galleries[i] = galleries[i].trim() + ' a';
				}
				//console.log( galleries.join(', ') );
				galleries = box.arrayUnique( galleries );
				return galleries.join(', ');
			},
			getElementsString: function() {
				return box.element;
			},
			addGallery: function( selector ) {

				var galleries = box.gallery.split(',');
				galleries.push( selector );

				galleries = box.arrayUnique( galleries );
				box.gallery = galleries.join(', ');

				applyUserInteractionEvents()
			},
			removeGallery: function( selector ) {

				var galleries = box.gallery.split(',');
				$.each(galleries, function( i ) {
					if( this.trim() == selector.trim() ) {
						galleries.splice(i, 1);
					}
				});

				galleries = box.arrayUnique( galleries );
				box.gallery = galleries.join(', ');

				applyUserInteractionEvents()
			},
			addElement: function( selector ) {

				var elements = box.element.split(',');
				$.each(elements, function( i ) {
					elements[i] = elements[i].trim();
				});
				elements.push( selector );

				elements = box.arrayUnique( elements );
				box.element = elements.join(', ');

				applyUserInteractionEvents()
			},
			removeElement: function( selector ) {

				var elements = box.element.split(',');
				$.each(elements, function( i ) {
					if( this.trim() == selector.trim() ) {
						elements.splice(i, 1);
					}
				});

				elements = box.arrayUnique( elements );
				box.element = elements.join(', ');

				applyUserInteractionEvents()
			},
			arrayUnique: function( arr ) {
				var unique = [];
				for (var i = 0; i < arr.length; i++) {
					if (unique.indexOf(arr[i]) == -1) {
						unique.push(arr[i]);
					}
				}
				return unique;
			},









			types: {
				image: function( url, attrs ) {
					var match = url ? url.match(/^.*\.(jpeg|jpg|gif|png)$/) : null;
					//console.log(match, 'image');
					if( match ) {
						var image = $('<img/>');
						return image.attr({
							src: url
						});
					}
				},
				youtube: function( url, attrs ) {
					var match = url ? url.match(/^.*((youtu.be\/)|(v\/)|(watch\?))v?=?([^#\&\?]*).*/) : null;
					//console.log(match, 'youtube');
					if( match ) {
						var iframe = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen />');
						return iframe.attr({
							frameborder: 0,
							src: 'http://www.youtube.com/embed/' + match[match.length-1],
							width: 640,
							height: 480
						});
					}
				},
				vimeo: function( url, attrs ) {
					var match = url ? url.match(/^.*(vimeo.com)\/(\d+)/) : null;
					//console.log(match, 'vimeo');
					if( match ) {
						var iframe = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen />');
						return iframe.attr({
							frameborder: 0,
							src: 'http://player.vimeo.com/video/' + match[match.length-1]
						});
					}
				},
				web: function( url, attrs ) {
					var match = url ? url.match(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/) : null;
					//console.log(match, 'web');
					if( match ) {
						var iframe = $('<iframe/>');
						return iframe.attr({
							frameborder: 0,
							src: url,
							width: 640,
							height: 480
						});
					}
				},
				html: function( url, attrs ) {
					var match = url ? url.match(/^\#/) : null;
					//console.log(match, 'html');
					if( match ) {
						var element = $( url ).clone().show();
						var div = $('<div/>').addClass('mediabox-html-element-wrapper');
						return div.css({
							'max-width': $(window).width(),
							'max-height': $(window).height()
						}).append( element );
					}
				}
			},
			before: function(){},
			after: function(){},
			unload: function(){}
		};
		$.extend( true, box, settings );









		/* user interaction */

		function applyUserInteractionEvents() {
			$( document ).off( 'click', box.storage.element.toString() );
			$( document ).off( 'click', box.storage.gallery.toString() );
			/* none gallery element was clicked */

			$( document ).on('click', box.getElementsString(), function(e) {
				e.preventDefault();
				var url = $(this).attr('href');
				var attrs = {};
				var title = '';

				//console.log(box.element)

				if( $(this).attr('data-dimension') ) {
					attrs.width = $(this).attr('data-dimension').split('x')[0];
					attrs.height = $(this).attr('data-dimension').split('x')[1];
				}

				if( $(this).attr('title') ) {
					title = $(this).attr('title');
				}
				box.stack = [];
				box.stack.push({
					url: $(this).attr('href'),
					attrs: attrs,
					title: $(this).attr('title') ? $(this).attr('title') : ''
				});
				box.queue();
				return false;
			});

			//console.log( box.getGalleriesString() );
			/* a gallery element was clicked */
			//console.log( 'storage:', box.storage.gallery.toString() );
			//console.log( '  fresh:', box.getGalleriesString() );

			$( document ).on('click', box.getGalleriesString(), function(e) {
				//e.preventDefault();
				//console.log(this);
				var current_item = $(this);
				//console.log( current_item.is( $(box.exclude) ),  box.exclude);

				if( current_item.is( $(box.exclude) ) ) {
					return true;
				}

				var gallery = $( box.gallery ).has( this );
				var items = $( gallery ).find('a').not( box.exclude );

				box.stack = [];
				if( current_item.parent( box.gallery ).length == 1 ) {
					box.current = current_item.index();
				} else {
					box.current = items.index( current_item );
				}
				//console.log( box.current );

				items.each(function() {
					var attrs = {};
					if( $(this).attr('data-dimension') ) {
						attrs.width = $(this).attr('data-dimension').split('x')[0];
						attrs.height = $(this).attr('data-dimension').split('x')[1];
					}
					var item = {
						url: $(this).attr('href'),
						attrs: attrs,
						title: $(this).attr('title') ? $(this).attr('title') : ''
					};
					box.stack.push( item );
				});

				if( box.current > -1 ) {
					box.queue();
				}
				
				//console.log('gallery', items, box.current);
				return false;
			});
			
			box.cotainer.off('click');
			
			box.cotainer.on('click', '.mediabox-controls>a', function(e) {
				e.preventDefault();
				if( $(this).hasClass('mediabox-close') ) {
					box.close();
				} else if( $(this).hasClass('mediabox-prev') ) {
					box.prev();
				} else if( $(this).hasClass('mediabox-next') ) {
					box.next();
				}

				//console.log('controls');
				return false;
			});

			box.cotainer.on('click', '.mediabox-background-closer', function(e) {
				box.close();
				//console.log('bg close');
			});

			box.storage.element = box.getElementsString();
			box.storage.gallery = box.getGalleriesString();
		} //END applyUserInteractionEvents


		function applyTouchGestures() {
			/* tuch/swipe */
			if( window.Hammer && box.is_open ) {
				var element = document;
				var options = {
					drag: true,
					dragLockToAxis: true,
					dragBlockHorizontal: true
				};
				box.hammer = new Hammer(element, options);

				box.hammer.on('swipeleft', swipeleft);
				box.hammer.on('swiperight', swiperight);
				box.hammer.on('pinchin', pinchin);
			}
		}

		function destroyTouchGestures() {
			if( box.hammer ) {
				box.hammer.off('swipeleft');
				box.hammer.off('swiperight');
				box.hammer.off('pinchin');

				delete box.hammer;
			}
		}

		function swipeleft( e ) {
			e.gesture.preventDefault();
			box.next();
			//console.log('swipeleft');
		}

		function swiperight( e ) {
			e.gesture.preventDefault();
			box.prev();
			//console.log('swiperight');
		}

		function pinchin( e ) {
			e.gesture.preventDefault();
			box.close();
			//console.log('pinchin');
		}



		
		$(window).on('resize', function(){
			if( box.cotainer !== undefined && box.cotainer.trigger ) {
				box.cotainer.trigger('mediabox.resize');
			}
		});
		

		if( $('.mediabox-window').length === 0 ) {
			box.init();
			applyUserInteractionEvents();
		}
		
		return box;
	};
})(jQuery);

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		'use strict';
		return this.replace( /^\s+|\s+$/g, '' );
	};
}