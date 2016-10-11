/* global console:false, jQuery:false, MediaBox:false */

var atbb = {
	use_lightbox_script: true,
	use_slider_script: true,
	use_masonry_script: true,
	use_team_members_script: true,
	use_parallax: true,
	sliders: []
};

(function($) {
	'use strict';
	atbb.easing = 'ease';

	if ( !$.support.transition || $().transition === undefined ) {
		atbb.easing = 'easeInOutSine';
	}

	$(document).ready(function() {
		//console.log('asdasd');
	});

	$(window).load(function() {
		atbb.applyToggles();
		atbb.applyTabs();
		

		if( atbb.use_lightbox_script ) {
			atbb.applyLightbox();
		}

		if( atbb.use_slider_script ) {
			atbb.applySlider();
		}

		if( atbb.use_masonry_script ) {
			atbb.applyMasonry();
		}

		if( atbb.use_team_members_script ) {
			atbb.applyTeamMembers();
		}

		//
		var flex_sldiers = $('.atbb-slider-gallery-wrapper, .atbb-team-members-sldier');
		var ready_sliders = 0;
		var viable_sliders = [];

		flex_sldiers.each(function() {
			if( $(this).find('li').length > 1 ) {
				atbb.sliders.push( $(this) );
			}
		});

		$.each(atbb.sliders, function() {
			viable_sliders.push( $(this) );
			//console.log( viable_sliders );
		});

		$('body').on('flexslider.ready', function() {
			if( viable_sliders.length - 1 === ready_sliders ) {
				//console.log( 'all sliders are ready' );
				atbb.applyRowBackgroundMedia();
			}
			
			ready_sliders++;
			//console.log( 'slider ready', viable_sliders.length, ready_sliders );
		});

		if( viable_sliders.length === 0 ) {
			atbb.applyRowBackgroundMedia();
		}
		
	});







	atbb.applyRowBackgroundMedia = function() {
		var paralax = $('.section-background-media-container.section-media-background-type-parallax');
		
		var fixed_normal = $('.section-background-media-container.section-media-background-type-fixed, .section-background-media-container.section-media-background-type-normal');

		fixed_normal.each(function() {
			var cont = $(this);
			new BackgroundMediaSection( cont );
		});
		
		paralax.each(function(){
			var cont = $(this);
			if( atbb.use_parallax ) {
				new ParallaxSection( cont );
			} else {
				new BackgroundMediaSection( cont );
			}
		});

	};

	function BackgroundMediaSection( element ) {
		var row = element;
			row.type = row.attr('data-type');
			row.src = row.attr('data-src');
			row.mime = row.attr('data-mime') ? row.attr('data-mime') : '';

		function __construct() {
			if( row.type === 'image' ) {
				var img = $('<img/>');
					img.on('load', function() {
						//console.log( 'image loaded' );

						row.css({ 'background-image': 'url('+row.src+')' });
						row.fadein();
					});
					img.attr({ src: row.src });
				//	
			} else if( row.type === 'video' ) {
				//
				var video = $('<video/>', { muted: true, loop: true, autoplay: true });
				var source = $('<source/>', {
					type: row.mime,
					src: row.src
				});

				source.appendTo( video );

				video.appendTo( row ).get( 0 ).addEventListener( 'canplaythrough', function() {
					//console.log( 'video loaded' );

					row.fadein();
				});
			}
		}

		row.fadein = function() {
			if( !row.hasClass('atbb-bg-loaded') ) {
				row.scroll();
				row.addClass('atbb-bg-loaded');
				row.css({
					opacity: row.attr('data-opacity')
				});

				//console.log(row.get(0));
			}
		};

		__construct();
		return row;
	}


	function ParallaxSection( element ) {
		if( !element || element.length === 0 ) { return; }

		var row = element;
			row.type = row.attr('data-type');
			row.src = row.attr('data-src');
			row.mime = row.attr('data-mime') ? row.attr('data-mime') : '';

		if( !row.src ) { return; }

		function __construct() {

			if( row.type === 'image' ) {
				var img = $('<img/>');
					img.on('load', function() {
						//console.log( 'image loaded' );

						row.css({ 'background-image': 'url('+row.src+')' });
						row.fadein();
					});
					img.attr({ src: row.src });
				//	
			} else if( row.type === 'video' ) {
				//
				var video = $('<video/>', { muted: true, loop: true, autoplay: true });
				var source = $('<source/>', {
					type: row.mime,
					src: row.src
				});

				source.appendTo( video );

				video.appendTo( row ).get( 0 ).addEventListener( 'canplaythrough', function() {
					//console.log( 'video loaded' );

					row.fadein();
				});
			}
			
			row.refresh();
		}
		
		//var wpadminbar_height = !isNaN( $('#wpadminbar').height() ) ? $('#wpadminbar').height() : 0;

		row.refresh = function() {
			row._height = row.height();
			row.winHeight = $(window).height();
			var paddings = (row.winHeight - row._height) / 2;

			row.css({
				y: 0,
				'padding-top': 0,
				'padding-bottom': 0,
				top: 0
			});
			row.offsetTop = row.offset().top;

			row.css({
				'padding-top': paddings,
				'padding-bottom': paddings,
				top: 0 - (paddings * 2)
			});


			var video = row.find('video');
			video.css({
				top: (row.outerHeight() / 2) - (video.outerHeight() / 2)
			});
			//console.log('resized', row.winHeight, row.height, row.offsetTop, paddings )
			row.scroll();
		};

		row.scroll = function() {
			row.scrollTop = $(window).scrollTop();

			var zeroed_offset = row.scrollTop - (row.offsetTop - row.winHeight);
			var perc = zeroed_offset * 100 / (row.winHeight + row._height);
			var pos = (row.winHeight * perc / 100) - row._height / 2;

			if( row.scrollTop > row.offsetTop - row.winHeight && row.scrollTop < row.offsetTop + row._height  ) {
				//console.log( 'inside', perc );
				element.css({
					'-webkit-transform': 'translate3d(0, '+pos.toFixed(2)+'px, 0)',
					'-moz-transform': 'translate3d(0, '+pos.toFixed(2)+'px, 0)',
					'-o-transform': 'translate3d(0, '+pos.toFixed(2)+'px, 0)',
					'transform': 'translate3d(0, '+pos.toFixed(2)+'px, 0)'
				});
			}
		};

		row.resize = function() {
			row.refresh();
			row.scroll();
		};

		row.fadein = function() {
			if( !row.hasClass('atbb-bg-loaded') ) {
				row.scroll();
				row.addClass('atbb-bg-loaded');
				row.css({
					opacity: row.attr('data-opacity')
				});
			}
		};

		row.reqAnimScroll = function() {
			window.requestAnimationFrame(row.scroll);
		}

		row.reqAnimResize = function() {
			window.requestAnimationFrame(row.resize);
		}

		$(window).off( 'scroll', row.reqAnimScroll );
		$(window).on( 'scroll', row.reqAnimScroll );

		$(window).off( 'resize', row.reqAnimResize );
		$(window).on( 'resize', row.reqAnimResize );

		__construct();

		return row;
	}





	atbb.applyLightbox = function() {
		atbb.lightbox = new MediaBox({
			/*element: 'a.show_review_form',*/
			gallery: '.atbb-grid-gallery,.atbb-slider-gallery',
			duration: 500,
			easing: atbb.easing,
			exclude: '.atbb-no-lightbox'
		});
	};





	atbb.applySlider = function() {
		if( $().flexslider ) {
			$('.atbb-slider-gallery-wrapper').each(function() {
				var animation_type = $('.atbb-slider-gallery', this).attr( 'data-animation-type' );
				var use_controls = $('.atbb-slider-gallery', this).attr( 'data-use-controls' ) === 'true' ? true : false;
				var use_pageination_controls = $('.atbb-slider-gallery', this).attr( 'data-use-pagination-controls' ) === 'true' ? true : false;
				var anim_speed = parseFloat($('.atbb-slider-gallery', this).attr( 'data-slideshow-speed' )) * 1000;
				var slideshow_speed = parseFloat($('.atbb-slider-gallery', this).attr( 'data-animation-speed' )) * 1000;
				//console.log(use_controls);
				//init the slider
				var slider = $(this);
				if( slider.find('ul>li').length < 2 ) {
					//$('body').trigger('flexslider.ready');
					return;
				}

				slider.flexslider({
					selector: '.atbb-slider-gallery > li',
					animation: animation_type,
					smoothHeight: true,
					controlNav: use_pageination_controls,
					directionNav: use_controls,
					prevText: '',
					nextText: '',
					slideshowSpeed: anim_speed ? anim_speed : 600,
					animationSpeed: slideshow_speed ? slideshow_speed : 6000,
					useCSS: true,
					start: function() {
						setTimeout(function(){
							slider.addClass('atbb-slider-ready');
							$('body').trigger('flexslider.ready');
						}, 200);
					}
				});


			});
		}
	};



	atbb.applyTeamMembers = function() {
		var team_members = $('.atbb-team-members-slider');

		team_members.each(function() {
			new TeamMembersSlider( $(this) );
		});
	};

	function TeamMembersSlider( container ) {
		if( container === undefined ) return false;

		var ul = container.find('ul.atbb-team-members');
		var lis = ul.children();

		var margin = parseInt( lis.eq(0).css('margin-right') );
		var width = parseInt( lis.eq(0).width() );
		var cols = parseInt( ul.attr('data-columns') );

		lis.css({
			'margin-right': margin
		});

		function layout() {
			container.flexslider({
				animation: 'slide',
				selector: '.atbb-team-members > li',
				animationLoop: false,
				slideshow: false,
				itemWidth: width,
				itemMargin: margin,
				maxItems: cols,
				prevText: '',
				nextText: '',
				controlNav: false,
				useCSS: true,
				directionNav: lis.length <= cols ? false : true,
				start: function() {
					setTimeout(function(){
						container.addClass('atbb-slider-ready');
						$('body').trigger('flexslider.ready');
					}, 500);
				}
			});
		}

		layout();

		//$(window).resize(layout);

		ul.data('TeamMembers', ul);
		return ul;
	}












	atbb.applyMasonry = function() {
		var container = $('.atbb-masonry-gallery');

		//console.log($().masonry);

		if( $().masonry && container.length ) {
			$(window).resize(layoutMasonry);
			//console.log( container );
			layoutMasonry();
		}

		if( $().isotope && container.length ) {
			$(window).resize(layoutIsotope);
			//console.log( container );
			layoutIsotope();
		}

		function layoutMasonry() {
			var columnWidth = '.atbb-grid-gallery-grid-sizer';
			var gutter = '.atbb-grid-gallery-gutter-sizer';
			//console.log( columnWidth );
			container.masonry({
				isRTL: $('body').hasClass('rtl') ? true : false,
				itemSelector: 'li.atbb-gallery-item',
				columnWidth: columnWidth,
				gutter: gutter
			});
		}

		function layoutIsotope() {
			var columnWidth = '.atbb-grid-gallery-grid-sizer';
			var gutter = '.atbb-grid-gallery-gutter-sizer';
			//console.log( columnWidth );
			container.isotope({
				isOriginLeft: $('body').hasClass('rtl') ? false : true,
				itemSelector: 'li.atbb-gallery-item',
				masonry: {
					columnWidth: columnWidth,
					gutter: gutter
				}
			});
		}

		
	};






	atbb.applyToggles = function() {
		var toggles = $('ul.toggle');

		toggles.each( function() {
			var toggle = $(this);
			var lis = toggle.children('li');
			var buttons = toggle.children('li').children('a');

			var contents = toggle.find('.toggle-item-content');

			lis.each(function() {
				var content = $(this).find('.toggle-item-content');
				content.css({
					height: content.outerHeight()
				});
			}).not('.open').addClass('close');

			buttons.on('click', function() {
				var index = lis.has( this ).index();
				var current = lis.eq( index );
				var content = current.find('.toggle-item-content');

				if( toggle.hasClass('accordion') ) {
					lis.removeClass('open').addClass('close');
					current.addClass('open').removeClass('close');
				} else {
					if( current.hasClass('open') ) {
						current.removeClass('open').addClass('close');
					} else {
						current.addClass('open').removeClass('close');
					}
				}
				return false;
			});
		});
	};


	atbb.applyTabs = function() {
		var tabboxes = $('.tab-box');

		tabboxes.each( function() {
			var tabbox = $(this);
			var button_wrappers = tabbox.children('.tab-btns').children('li');
			var buttons = tabbox.find('.tab-btns a');
			var tabs = tabbox.children('.tabs').children('li');

			buttons.on('click', function() {
				var index = button_wrappers.has( this ).index();
				//console.log(index);

				button_wrappers.removeClass('active-tab');
				tabs.removeClass('active-tab');

				button_wrappers.eq( index ).addClass('active-tab');
				tabs.eq( index ).addClass('active-tab');

				return false;
			});
		});
	};

})(jQuery);

//requestAnimationFrame && cancelAnimationFrame polyfill
(function() {
	'use strict';

	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());