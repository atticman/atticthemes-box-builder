<?php
/*
Plugin Name: AtticThemes: Box Builder
Plugin URI: http://atticthemes.com
Description: This plugin makes it possible to build layouts in no time. It includes many widgets to help you setup your content fast and easily.
Version: 2.3.7
Author: atticthemes
Author URI: http://themeforest.net/user/atticthemes
Requires: 4.3.0
Tested: 4.5.2
Updated: 2016-05-20
Added: 2014-02-01
*/
?>
<?php
if( !class_exists('AtticThemes_BoxBuilder') ) {

	class AtticThemes_BoxBuilder {
		public $version = '2.3.7';
		public $theme;

		private $dev = true;
		private $min_suffix = '.min';

		public static $templates = array();
		public static $post_types = array();
		public static $metabox_settings;

		private static $scripts = array();
		private static $styles = array();

		public static $disabled_widgets = array();

		private $post_id;

		private $meta;

		public static function Init() {
			new AtticThemes_BoxBuilder();
		}

		public static function addResource( $name, $uri, $type, $version = null ) {
			if( $type === 'script' ) {
				self::$scripts[] = array(
					'name' => $name,
					'uri' => $uri,
					'version' => $version ? $version : $this->version
				);
			} elseif( $type === 'style' ) {
				self::$styles[] = array(
					'name' => $name,
					'uri' => $uri,
					'version' => $version ? $version : $this->version
				);
			}
		}

		public static function addPostTypeSupport( $post_types ) {
			if( is_array($post_types) ) {
				self::$post_types = array_merge( self::$post_types, $post_types );
			} elseif( is_string($post_types) ) {
				self::$post_types = array_merge( self::$post_types, array($post_types) );
			}
		}

		public static function disableWidgets( $widgets ) {
			if( is_array($widgets) ) {
				self::$disabled_widgets = array_merge(self::$disabled_widgets, $widgets);
			} elseif( is_string($widgets) ) {
				self::$disabled_widgets[] = $widget;
			}
		}



		public function __construct() {
			$this->theme = wp_get_theme();

			//set the namespace
			self::$metabox_settings['namespace'] = '_atticthemes_box_builder';
			//set the postypes for the plugin to add the builder for
			self::$post_types = array_merge( self::$post_types, array( 'page' ) );

			if( $this->dev ) {
				$this->min_suffix = '';
			}

			//add actions
			/* add image sizes */
			/*if ( function_exists( 'add_image_size' ) ) {
				add_image_size( 'atbb-thumbnail', 200, 200, true );
				add_image_size( 'atbb-medium', 280, 280, true );
				add_image_size( 'atbb-large', 420, 420, true );
			}
			add_filter ( 'wp_prepare_attachment_for_js',  array( $this, 'add_image_sizes_to_uploader' ), 10, 3  );*/

			/* admin init */
			add_action( 'admin_init', array( $this, 'init_admin' ) );
			add_action( 'wp_restore_post_revision', array( $this, 'revert_to_revision'), 10, 2 );
			/* admin scripts and styles */
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts_and_style' ) );
			/* ave ajax action */
			add_action( 'wp_ajax_atbb_save_layouts', array( $this, 'save_layout') );


			/* add filters */
			add_filter( 'mce_css', array( $this, 'mce_css' ) );
			add_filter( 'the_content', array( $this, 'the_content' ), 0 );
			add_filter( 'body_class', array( $this, 'body_class' ), 0 );

			/* Front-end */
			add_shortcode( 'atbb_attachment', array( $this, 'shortcode_atbb_attachment' ) );
			add_shortcode( 'atbb_search_form', array( $this, 'shortcode_atbb_search_form' ) );
			/* scripts and styles */
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_front_end_scripts_and_style' ) );


			/* hook into save post for the revision stuff */
			add_action( 'save_post', array( $this, 'save_post' ) );
			add_action( 'wp_restore_post_revision', array( $this, 'restore_revision' ), 10, 2 );


			//add_action(  'transition_post_status',  array( $this, 'on_all_status_transitions' ), 10, 3 );
		}

		public function on_all_status_transitions( $new_status, $old_status, $post ) {
			error_log($old_status .' : '. $new_status);
		}

		public function save_post( $post_id ) {
			$parent_id = wp_is_post_revision( $post_id );
			if ( $parent_id ) {
				$parent  = get_post( $parent_id );
				$meta = $this->get_post_meta( $parent->ID );

				if ( false !== $meta ) {
					add_metadata( 'post', $post_id, self::$metabox_settings['namespace'], $meta );
				}
			}
		}

		public function restore_revision( $post_id, $revision_id ) {
			$post = get_post( $post_id );
			$revision = get_post( $revision_id );
			$meta  = get_metadata( 'post', $revision->ID, self::$metabox_settings['namespace'], true );

			if ( false !== $meta ) {
				update_post_meta( $post_id, self::$metabox_settings['namespace'], $meta );
			} else {
				delete_post_meta( $post_id, self::$metabox_settings['namespace'] );
			}
		}




		public function mce_css( $mce_css ) {
			if ( ! empty( $mce_css ) )
			$mce_css .= ',';
			$mce_css .= plugins_url( 'css/atp-editor-style'.$this->min_suffix.'.css' , __FILE__ );
			return $mce_css;
		}

		public function shortcode_atbb_search_form( $attr ) {
			return get_search_form( false );
		}

		public function shortcode_atbb_attachment( $attr ) {
			$attr = array(
				'id' => isset($attr['id']) ? $attr['id'] : 0,
				'size' => isset($attr['size']) ? $attr['size'] : 'full',
				'title' => isset($attr['title']) ? $attr['title'] : false,
				'url' => isset($attr['url']) ? $attr['url'] : false,
				'link' => isset($attr['link']) ? $attr['link'] : false,
				'target' => isset($attr['target']) ? $attr['target'] : false,
				'dimension' => isset($attr['dimension']) ? $attr['dimension'] : false,
				'parent' => isset($attr['parent']) ? $attr['parent'] : false,
				'columns' => isset($attr['columns']) ? intval($attr['columns']) : false,
				'container' => isset($attr['container']) ? $attr['container'] : false,
			);

			$img = wp_get_attachment_image_src( $attr['id'], $attr['size'] );

			$title = isset($attr['title']) ? $attr['title'] : '';
			if( $img && isset($img[0]) ) {
				$output = '<img src="'. $img[0] .'" title="'. $title .'" alt="'. $title .'" width="'. $img[1] .'" height="'. $img[2] .'" class="attachment-size-'.$attr['size'].'" />';
			} else if( isset($attr['url']) ) {
				$output = '<img src="'. $attr['url'] .'" title="'. $title .'" alt="'. $title .'" width="100%" />';
			} else {
				$output = '';
			}
			
			return apply_filters( 'atbb_attachment', $output, $attr );
		}

		public function enqueue_front_end_scripts_and_style() {
			global $post;

			if( !isset($post->ID) ) {
				return;
			}
			
			$post_type = get_post_type( $post );
			$meta = $this->get_post_meta( $post->ID );
			//check if a supported post type is being shown
			//also, check if there is an output from the builder, if not do not load the scripts and styles
			if( in_array( $post_type, self::$post_types ) && isset($meta) && isset($meta[0]) ) {
				//finaly register and enqueue styles and scripts
				//css
				wp_register_style(
					'atbb-style',
					plugins_url( 'css/atticthemes-box-builder-front-end-style.css', __FILE__ ),
					array(),
					$this->version,
					'all'
				);
				wp_enqueue_style( 'atbb-style' );


				//javascript ---------
				//wp_enqueue_script( 'jquery-masonry' );
				
				//transit
				wp_register_script(
					'atbb-transit-script',
					plugins_url( 'javascript/jquery.transit.min.js', __FILE__ ),
					array( 'jquery' ),
					$this->version,
					true
				);
				wp_enqueue_script( 'atbb-transit-script' );

				//flexslider
				wp_register_script(
					'atbb-flex-slider-script',
					plugins_url( 'javascript/jquery.flexslider'.$this->min_suffix.'.js', __FILE__ ),
					array( 'jquery' ),
					$this->version,
					true
				);
				wp_enqueue_script( 'atbb-flex-slider-script' );

				//mediabox
				wp_register_script(
					'atbb-media-box-script',
					plugins_url( 'javascript/jquery.mediabox'.$this->min_suffix.'.js', __FILE__ ),
					array( 'jquery' ),
					$this->version,
					true
				);
				wp_enqueue_script( 'atbb-media-box-script' );

				//front end script
				wp_register_script(
					'atbb-script',
					plugins_url( 'javascript/atticthemes-box-builder-front-end-script'.$this->min_suffix.'.js', __FILE__ ),
					array( 'jquery' ),
					$this->version,
					true
				);
				wp_enqueue_script( 'atbb-script' );
			}
		}

		public function body_class( $classes ) {
			global $post;
			$classes[] = 'boxbuilder';

			if( isset($post->ID) && is_singular() ) {
				$meta = $this->get_post_meta( $post->ID );
				if( isset($meta[0]) ) {
					$classes[] = 'boxbuilder-content';
				}
				
				//error_log(var_export($meta, true));
			}
			return $classes;
		}

		public function the_content( $content ) {
			global $post;
			

			if( isset( $post->ID ) && in_array(get_post_type($post->ID), self::$post_types) ) {
				$meta = $this->get_post_meta( $post->ID );

				/* if the content version is grater or equal then 2.1.8 return post content without any modifictaion */
				if( isset($meta['content-version']) && version_compare($meta['content-version'], '2.1.8', '>=') ) return $content;

				/* this section of code is for content version below 2.1.8, which modifies the content */
				$output = isset( $meta['output'] ) ? preg_replace('/##post_content##/', $content, $meta['output']) : $content;
				$content = do_shortcode( $output );
				//print_r( $meta );
			}
			return $content;
		}

		public function enqueue_admin_scripts_and_style() {
			global $post;
			$screen = get_current_screen();
			//print_r($screen->id);
			if( isset($screen) && isset($screen->id) && in_array($screen->id, self::$post_types) && isset($post) && isset($post->ID) ) {
				$post_type = get_post_type( $post );
				if( in_array( $post_type, self::$post_types ) ) {
					//css

					//fontawesome
					$fa_url = 'http://netdna.bootstrapcdn.com/font-awesome/4.1.1/css/font-awesome.css';
					$fa_req = wp_remote_head( $fa_url );
					if( !is_wp_error($fa_req) ) {
						if( isset($fa_req['response']) && isset($fa_req['response']['code']) && ($fa_req['response']['code'] === 200 || $fa_req['response']['code'] === 304) ) {
						} else {
							$fa_url = plugins_url( 'css/font-awesome'.$this->min_suffix.'.css' , __FILE__ );
						}
					} else {
						$fa_url = plugins_url( 'css/font-awesome'.$this->min_suffix.'.css' , __FILE__ );	
					}
					wp_register_style('atticthemes-box-builder-fontawesome-admin', $fa_url, array(), $this->version, 'all');
					wp_enqueue_style( 'atticthemes-box-builder-fontawesome-admin' );




					wp_enqueue_style( 'wp-color-picker' );
					wp_register_style(
						'atticthemes-box-builder-style-admin',
						plugins_url( 'css/atticthemes-box-builder-style-admin'.$this->min_suffix.'.css' , __FILE__ ),
						array(),
						$this->version,
						'all'
					);
					wp_enqueue_style( 'atticthemes-box-builder-style-admin' );

					foreach( self::$styles as $style ) {
						wp_register_style( $style['name'], $style['uri'], array(), $style['version'], 'all' );
						wp_enqueue_style( $style['name'] );
					}

					//javascript
					wp_enqueue_script( 'wp-color-picker' );
					//transit
					wp_register_script(
						'atbb-admin-transit-script',
						plugins_url( 'javascript/jquery.transit.min.js', __FILE__ ),
						array( 'jquery' ),
						$this->version,
						true
					);
					wp_enqueue_script( 'atbb-admin-transit-script' );

					wp_register_script(
						'atticthemes-box-builder-script-admin',
						plugins_url( 'javascript/atticthemes-box-builder-script-admin'.$this->min_suffix.'.js' , __FILE__ ),
						array( 'jquery', 'jquery-ui-sortable' ),
						$this->version,
						true
					);
					wp_enqueue_script( 'atticthemes-box-builder-script-admin' );

					//widgets srcript
					wp_register_script(
						'atticthemes-box-builder-script-widgets',
						plugins_url( 'javascript/atticthemes-box-builder-script-widgets'.$this->min_suffix.'.js' , __FILE__ ),
						array( 'jquery' ),
						$this->version,
						true
					);
					wp_enqueue_script( 'atticthemes-box-builder-script-widgets' );


					foreach( self::$scripts as $script ) {
						wp_register_script( $script['name'],
							$script['uri'], 
							array( 'jquery', 'atticthemes-box-builder-script-admin', 'atticthemes-box-builder-script-widgets' ), 
							$script['version'],
							true
						);
						wp_enqueue_script( $script['name'] );
					}
				}//END if in array
			}//END if the $post is set
		}

		public function init_admin() {
			/* setup the metabox */
			foreach( self::$post_types as $post_type ) {
				if( post_type_exists( $post_type ) ) {
					self::$metabox_settings['id'] = 'atticthemes_box_builder_metabox';
					self::$metabox_settings['title'] = __('Box Builder', 'atticthemes_box_builder');
					self::$metabox_settings['nonce'] =  array(
						'name' => '_atticthemes_box_builder_metabox_nonce_',
						'value' => wp_create_nonce( '_atticthemes_box_builder_metabox_nonce_' ),
					);
					self::$metabox_settings['ajax_url'] = admin_url( 'admin-ajax.php' );

					add_meta_box(
						self::$metabox_settings['id'],
						self::$metabox_settings['title'],
						array($this, 'setup_metabox'),
						$post_type,
						'normal',
						'high',
						self::$metabox_settings
					);
					//add_action( 'save_post', array($this, 'save_metabox') );
				}//END if post type exists
			}
		}

		//setup the metabox
		public function setup_metabox( $post, $settings ) {
			//store the metabox data as well
			//update_post_meta( $post->ID, self::$metabox_settings['namespace'], '' );
			self::$metabox_settings['version'] = $this->version;
			self::$metabox_settings['data'] = $this->get_post_meta( $post->ID );
			self::$metabox_settings['post_id'] = $post->ID;
			self::$metabox_settings['theme'] = array(
				'name' => $this->theme['Name'],
				'version' => $this->theme['Version']
			);
			//store all the necessary metabox settings
			$metabox_settings = self::$metabox_settings;
			//setup the nonce field

			//print_r( $this->sanitize_data($metabox_settings['data']) );
			wp_nonce_field( $metabox_settings['nonce']['name'], $metabox_settings['nonce']['name'], true, true );
			//hide metabox default header
			?><style type="text/css">
			#<?php echo $metabox_settings['id']; ?>.postbox { display: none; border-color: transparent; border-style: none; background-color: transparent; }
			#<?php echo $metabox_settings['id']; ?>.postbox .handlediv,
			#<?php echo $metabox_settings['id']; ?>.postbox .hndle { display: none; }
			#<?php echo $metabox_settings['id']; ?>.postbox .inside { margin: 0; padding: 0; margin-top: 5px; }
			</style><?php

			/* add additional data to the settings */
			$metabox_settings['disabled_widgets'] = self::$disabled_widgets;

			/* prepare the $metabox_settings data for javascript */
			$json_meta = json_encode( $metabox_settings );
			
			//stor the data in a JavaScript variable
			wp_localize_script( 'atticthemes-box-builder-script-admin', 'atticthemes_box_builder_json', $json_meta ); ?>
			<?php /*---------- the HTML STARTS here -----------*/ //print_r($metabox_settings); ?>
			
			<div class="atbb-editor-tabs">
				<div class="atbb-editor-tabs-wrapper">
					<button type="button" class="wp-switch-editor" data-switch="tmce">Visual</button>

					<button type="button" class="wp-switch-editor" data-switch="html">Text</button>

					<button class="atbb-switch-builder atbb-switch-builder-active" style="">Box Builder</button>
				</div>
			</div>

			<div class="atbb-header">
				<div class="atbb-title"><?php echo $metabox_settings['title']; ?></div>
				<ul class="atbb-controls">
					<!--<li class="atbb-toggle fa fa-chevron-down" title="<?php _e('Click to toggle', 'atticthemes_box_builder'); ?>"></li>-->

					<li class="atbb-save-layout fa fa-save" title="<?php _e('Save', 'atticthemes_box_builder'); ?>"></li>
					<li class="atbb-add-layout fa fa-plus-square" title="<?php _e('Add Section', 'atticthemes_box_builder'); ?>"></li>

					<li class="atbb-import fa fa-sign-in" title="<?php _e('Import', 'atticthemes_box_builder'); ?>"></li>
					<li class="atbb-export fa fa-sign-out" title="<?php _e('Export', 'atticthemes_box_builder'); ?>"></li>

					<li class="atbb-redo fa fa-share atbb-disabled" title="<?php _e('Redo', 'atticthemes_box_builder'); ?>"></li>
					<li class="atbb-undo fa fa-reply atbb-disabled" title="<?php _e('Undo', 'atticthemes_box_builder'); ?>"></li>
				</ul>
			</div>

			<div class="atbb-content"></div>
			
			<div class="atbb-widget-selector">
				<div class="atbb-widget-selector-wrapper">
					<div class="atbb-widget-selector-header">
						<span class="atbb-widget-selector-title">Widgets</span>
						<span class="atbb-widget-selector-close fa fa-times"></span>
					</div>
					<div class="atbb-widget-selector-content">
						<ul class="atbb-widget-selector-widget-list"></ul>
					</div>
				</div>
			</div>

			<div class="atbb-extension-container"></div>

			<input name="<?php echo self::$metabox_settings['namespace']; ?>[content-version]" class= "atbb-content-version-field" type="hidden" value="<?php echo isset($metabox_settings['data']) && isset($metabox_settings['data']['content-version']) ? $metabox_settings['data']['content-version'] : '1.0.0'; ?>" />
			<?php /*---------- and ENDS here -----------*/
		}

		//save the metabox data
		public function save_metabox( $post_id ) {
			if ( isset($_POST['post_type']) && 'page' == $_POST['post_type'] ) {
				if ( !current_user_can( 'edit_page', $post_id ) ) {
					return;
				}
			} else {
				if ( !current_user_can( 'edit_post', $post_id ) ) {
					return;
				}
			}
			
			if ( !isset( $_POST[ self::$metabox_settings['nonce']['name'] ] ) || !wp_verify_nonce( $_POST[ self::$metabox_settings['nonce']['name'] ], self::$metabox_settings['nonce']['name'] ) ) {
				return;
			}

			$current_data = $this->get_post_meta( $post_id );
			$new_data = isset( $_POST[ self::$metabox_settings['namespace'] ] ) ? $_POST[ self::$metabox_settings['namespace'] ] : null;

			$this->clear_metabox( $new_data );



			/**
			 * Turn data into string instead of saving an array
			 */
			$new_data = $this->stringify( $new_data );



			//--------------------------
			/* revision */
			$parent_id = wp_is_post_revision( $post_id );
			if ( $parent_id ) {
				$parent = get_post( $parent_id );
				if ( $new_data ) {
					update_metadata( 'post', $post_id, self::$metabox_settings['namespace'], $new_data );
				}
			}
			/* end revision */
			//--------------------------




			if (defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE) {
				return;
			}

			if ( $current_data ) {
				if ( is_null( $new_data ) ) {
					delete_post_meta( $post_id, self::$metabox_settings['namespace'] );
				} else {
					$new_data = $this->sanitize_data( $new_data );
					update_post_meta( $post_id, self::$metabox_settings['namespace'], $new_data );
				}
			} elseif ( !is_null( $new_data ) ) {
				$new_data = $this->sanitize_data( $new_data );
				update_post_meta( $post_id, self::$metabox_settings['namespace'], $new_data );
			}

		}

		public function revert_to_revision( $post_id, $revision_id ) {
			$meta = get_metadata( 'post', $revision_id, self::$metabox_settings['namespace'], true );

			//error_log(print_r($meta, true));

			if ( false === $meta ) {
				delete_post_meta( $post_id, self::$metabox_settings['namespace'] );
			} else {
				update_post_meta( $post_id, self::$metabox_settings['namespace'], $meta );
			}
		}

		private function sanitize_data( $data ) {
			//return $data;

			if( is_string($data) ) {
				$data = $this->unstringify( $data );
			}

			if( is_array($data) ) {
				array_walk_recursive( $data, array($this, 'clean') );
			}

			return $data;
		}

		private function clean( &$value ) {
			$value = stripslashes($value);
			$value = str_replace(array("\r\n"), "\n", $value);
			$value = str_replace(array("\t"), "", $value);
		}

		//clear the empty fields of the metabox from the data array
		private function clear_metabox( &$arr ) {
			if ( is_array( $arr ) ) {
				foreach ( $arr as $i => $v ) {
					if ( is_array( $arr[ $i ] ) ) {
						$this->clear_metabox( $arr[ $i ] );
						if ( !count( $arr[ $i ] ) ) {
							unset( $arr[ $i ] );
						}
					} else {
						if ( trim( $arr[ $i ] ) == '' ) {
							unset( $arr[ $i ] );
						}
					}
				}
				if ( !count( $arr ) ) {
					$arr = null;
				}
			}
		}



		public function save_layout() {
			if ( !isset($_REQUEST['nonce']) || (isset($_REQUEST['nonce']) && !wp_verify_nonce( $_REQUEST['nonce'], self::$metabox_settings['nonce']['name'] )) ) {
				exit( json_encode( array(
						'status' => 'error',
						'message' => 'Do not even try!',
					)
				));
			}
			//
			if( isset($_REQUEST['post_id']) && isset($_REQUEST['data']) ) {
				$data = $this->sanitize_data( $_REQUEST['data'] );

				$output = isset($data['output']) ? $data['output'] : false;
				
				/**
				 * Turn data into string instead of saving an array
				 */
				$data = $this->stringify( $data );

				update_post_meta( $_REQUEST['post_id'], self::$metabox_settings['namespace'], $data );

				if( $output ) {
					// Update post
					$the_post = array(
						'ID' => $_REQUEST['post_id'],
						'post_content' => $output,
					);
					// Update the post into the database
					wp_update_post( $the_post );
				}
				//error_log( var_export($data, true) );

				echo json_encode( array(
						'status' => 'success',
						'message' => __('The layout was successfully saved.', 'atticthemes_box_builder'),
					) 
				);
			} else {
				echo json_encode( array(
						'status' => 'error',
						'message' => __('Could not save the layout at this moment. Please try updating the post using the button in the "Publish" box.', 'atticthemes_box_builder'),
					) 
				);
			}
			die;
		}


		public function get_post_meta( $post_id ) {

			if( $this->meta ) {
				$meta = $this->meta;
			} else {
				$this->meta = get_post_meta( $post_id, self::$metabox_settings['namespace'], true );
				$meta = $this->meta;
			}

			
			
			if( is_array($meta) ) {
				return $meta;
			} elseif( is_string($meta) ) {
				$decoded_meta = json_decode(base64_decode( $meta ), true);

				//error_log(var_export( $decoded_meta, true));

				if( $decoded_meta ) {
					return $decoded_meta;
				} else {
					return false;
				}
			}
		}

		public function stringify( $data ) {

			//return $data;
			/**
			 * Turn data into string instead of saving an array
			 */
			$encoded_data = base64_encode( json_encode($data) );
			if( $encoded_data ) {
				$data = $encoded_data;
			}

			//error_log(var_export( json_decode($data, true ) , true));

			return $data;
		}

		public function unstringify( $data ) {
			/**
			 * Turn data into back into array
			 */
			$decoded_data = json_decode(base64_decode( $data ), true);

			if( $decoded_data ) {
				return $decoded_data;
			} else {
				return false;
			}
		}
		


		/*function add_image_sizes_to_uploader( $response, $attachment, $meta ){
			$size_array = array( 'atbb-thumbnail', 'atbb-medium', 'atbb-large' ) ;
			foreach ( $size_array as $size ) {
				if ( isset( $meta['sizes'][ $size ] ) ) {
					$attachment_url = wp_get_attachment_url( $attachment->ID );
					$base_url = str_replace( wp_basename( $attachment_url ), '', $attachment_url );
					$size_meta = $meta['sizes'][ $size ];

					$response['sizes'][ $size ] = array(
						'height' => $size_meta['height'],
						'width' => $size_meta['width'],
						'url' => $base_url . $size_meta['file'],
						'orientation' => $size_meta['height'] > $size_meta['width'] ? 'portrait' : 'landscape',
					);
				}
			}
			return $response;
		}*/
	}

	//AtticThemes_BoxBuilder::Init();

	function atbb_after_setup_theme() {
		AtticThemes_BoxBuilder::Init();
	}

	add_action( 'after_setup_theme', 'atbb_after_setup_theme' );
}

//

/* init updater */
/*require_once( 'updater.php' );
if( class_exists('AttichThemes_PluginUpdater') ) {
	new AttichThemes_PluginUpdater( __FILE__ );
}*/



/*
	How to remove/disable widgets

	//list of available widgets
	$widgets_to_disable = array(
		'TextBlock',
		'MediaGallery',
		'Tabs',
		'Toggles',
		'ServicesBlock',
		'MessageBox',
		'Separator',
		'Dropcap',
		'Break',
		'Skills',
		'TeamMembers',
		'SearchForm'
	);

	if( class_exists('AtticThemes_BoxBuilder') ) {
		//disable multiple widgets
		AtticThemes_BoxBuilder::disableWidgets( array('TextBlock', 'SearchForm') );
		
		//disable one widget at a time
		AtticThemes_BoxBuilder::disableWidgets( 'TextBlock' );
	}

*/