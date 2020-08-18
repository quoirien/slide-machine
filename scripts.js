// === globals =============================================
var CONTROLS_TIMEOUT_MS = 3000;
var KEY_BUFFER_TIMEOUT_MS = 2000;

var master_index = 1;
var sequences = {};
var states = {};
var state_sequences = {};
var layers = [];
var recording = false;
var buffer = [];

var restore_state = {
  "layers":[],
  "html":""
}

var paused = false;
var current_state_sequence = -1;
var state_sequence_rate = 4;
var state_sequence_position = 0;
var global_playback_mode = "normal";

class Sequence {
  constructor(name,type="clip") {
    this.type = type;
    this.name = name;
    this.frames = [];
    this.frames_length = 0;
  }
  add_frame(clip,filename,dims) {
    this.frames.push(new Frame(clip,filename,dims));
    this.frames_length ++;
  }
}

class Frame {
  constructor(clip,filename,dims) {
    this.clip = clip;
    this.filename = filename;
    this.dims = dims;
  }
}

class Layer {

  constructor() {
    this.init();
  }

  copy_layer_properties_from(copy_from) {
    //var copy_from = layers[target_index];

    this.sequence = {};
    if(copy_from.sequence && copy_from.sequence.name) {
      this.sequence.name = copy_from.sequence.name;
      this.sequence.type = copy_from.sequence.type;
      this.sequence.frames_length = copy_from.sequence.frames_length;
      this.sequence.frames = copy_from.sequence.frames.slice(0);
    }


    this.sequence_index = copy_from.sequence_index;
    this.dims = copy_from.dims;
    this.frame_index = copy_from.frame_index;
    this.playback_mode = copy_from.playback_mode;
    this.loop_points = [copy_from.loop_points[0],copy_from.loop_points[1]];
    this.frame_delay = copy_from.frame_delay;
    this.frame_advance = copy_from.frame_advance;
    this.cycle_offset = copy_from.cycle_offset;
    this.playback_pattern = copy_from.playback_pattern;
    try {
      this.playback_pattern_string = copy_from.playback_pattern_string;
    } catch(e) {
      //no problem
    }
    this.fill_mode = copy_from.fill_mode;
    for(var n in this.effects) {
      try {
        this.effects[n] = copy_from.effects[n].slice(0);
      } catch(e) {
        //no problem
      }

    }
    for(var n in this.effect_strings) {
      if(copy_from.effect_strings) {
        try {
          this.effect_strings[n] = copy_from.effect_strings[n];
        } catch(e) {
          //no problem
        }
      }
    }
    this.linked_layers = copy_from.linked_layers;
    this.is_linked = copy_from.is_linked;
  }

  init() {
    this.sequence = null;
    this.sequence_index;
    this.dims = [0,0];
    this.frame_index = 0;
    this.needs_redraw = true;
    this.playback_mode = "normal";
    this.loop_points = [-1,-1];
    this.frame_delay = 1;
    this.frame_advance = 1;
    this.linked_layers = 0;
    this.is_linked = false;
    this.cycle_offset = 0;
    //playback_pattern would be an array of frame advance amounts e.g. 1,1,1,1,-2,1,-2,1,1,1
    this.playback_pattern = [];
    this.playback_pattern_string = "";
    this.fill_mode = "fill";
    this.effects = {
      "zoom":[100],
      "shift_x":[0],
      "shift_y":[0],
      "opacity":[100],
      "flash":[1],
      "squash_x":[1000],
      "squash_y":[1000]
    };
    this.effect_strings = {
      "zoom":"100",
      "shift_x":"0",
      "shift_y":"0",
      "opacity":"100",
      "flash":"1",
      "squash_x":"1000",
      "squash_y":"1000"
    }
  }

  advance_frame() {
      this.do_advance_frame();
  }

  test_in_loop() {
    var first_point = Math.min(this.loop_points[0],this.loop_points[1]);
    var last_point = Math.max(this.loop_points[0],this.loop_points[1]);

    var between_them = ((this.frame_index > first_point) && (this.frame_index < last_point)) ? 1 : -1;
    var normal_loop = (this.loop_points[0] < this.loop_points[1]) ? 1 : -1;

    var my_truth = between_them * normal_loop;
    switch(my_truth) {
      case 1:
        return true;
      break;
      case -1:
        return false;
      break;
    }
  }

  do_advance_frame() {
    if((typeof this.sequence === "object") && (this.sequence != null) && (this.sequence.frames)) {
      var len = this.sequence.frames.length;
      var my_mode = this.playback_mode;
      if(this.playback_pattern && this.playback_pattern.length > 0 && my_mode == "normal") {
        console.log("I have a pattern");
        my_mode = "pattern";
      }
      switch(my_mode) {
        case "normal":
          this.frame_index += this.frame_advance;
        break;
        case "reverse":
          this.frame_index -= this.frame_advance;
        break;
        case "random":
          this.frame_index = Math.floor(Math.random() * len);
        break;
        case "pattern":
          this.frame_index += this.playback_pattern[0];
          this.playback_pattern.push(this.playback_pattern.shift());
        break;
        case "loop_repeat":
          if(this.loop_points[0] == -1) {
            this.loop_points[0] = 0;
          }
          if(this.loop_points[1] == -1) {
            this.loop_points[1] = len - 1;
          }
          this.frame_index += this.frame_advance;
          if(!(this.test_in_loop())) {
            if(this.frame_advance > 0) {
              //we want to go to the earliest loop point
              this.frame_index = Math.min(this.loop_points[0],this.loop_points[1]);
            } else {
              this.frame_index = Math.max(this.loop_points[0],this.loop_points[1])
            }
          }
        break;
        case "loop_bounce":
          if(this.loop_points[0] == -1) {
            this.loop_points[0] = 0;
          }
          if(this.loop_points[1] == -1) {
            this.loop_points[1] = len - 1;
          }
          this.frame_index += this.frame_advance;
          if(!(this.test_in_loop())) {
            this.frame_advance = 0 - this.frame_advance;
            this.frame_index += (this.frame_advance * 2);
            if(!(this.test_in_loop())) {
              //bit of a kludge to make sure we're in the loop next time
              this.frame_index = this.loop_points[0];
              //this.frame_index = Math.min(this.loop_points[0],this.loop_points[1]) + 1;
            }
          }
        break;
      }
      if(this.frame_index >= len) {
        this.frame_index = this.frame_index - len;
      }
      if(this.frame_index < 0) {
        this.frame_index = this.frame_index + len;
      }
      this.render_frame();
    }
  }

  render_frame() {
    //we want to find our index in layers
    var layer_index = layers.indexOf(this);
    var need_redraw_now = false;
    var my_frame = this.sequence.frames[this.frame_index];
    if(typeof my_frame === "undefined") {
      console.log("undefined frame " + this.frame_index);
    } else {
      if(recording && layer_index == current_layer()) {
        buffer.push(my_frame);
      }
    }
    for(var n in this.effects) {
      if((typeof this.effects[n] !== "string") && (this.effects[n].length > 1)) {
        this.effects[n].push(this.effects[n].shift());
        need_redraw_now = true;
      }
      var current_frame_dims = my_frame["dims"];
      if((this.dims[0] != current_frame_dims[0]) || (this.dims[1] != current_frame_dims[1])) {
        need_redraw_now = true;
      }
    }
    var my_image = $("#container img").eq(layer_index);
    if(this.needs_redraw || need_redraw_now) {
      my_image.removeClass("hideme");
      switch(this.effects.orientation) {
        case "normal":
          $("#container img").eq(layer_index).css("transform","none");
        break;
        case "flipx":
          $("#container img").eq(layer_index).css("transform","scaleX(-1)");
        break;
        case "flipy":
          $("#container img").eq(layer_index).css("transform","scaleY(-1)");
        break;
        case "flipboth":
          $("#container img").eq(layer_index).css("transform","rotate(180deg)");
        break;
      }
      my_image.css("opacity",this.effects.opacity[0] / 100);
      if(this.effects.flash[0] == 0) {
        my_image.css("display","none");
      } else {
        my_image.css("display","block");
      }
      this.dims = this.sequence.frames[this.frame_index]["dims"];

      //shift should be a percentage of the current container size
      var working_shift = [Math.floor((this.effects.shift_x[0] / 1000) * ($("#container").width())/2),Math.floor((this.effects.shift_y[0] / 1000) * ($("#container").height()/2))];

      var container_dims = [$("#container").width(),$("#container").height()];
      var scales = [container_dims[0]/this.dims[0],container_dims[1]/this.dims[1]];
      var scaling_ratio;
      switch(this.fill_mode) {
        case "fill":
          scaling_ratio = (scales[0] > scales[1]) ? scales[0] : scales[1];
        break;
        case "fit":
          scaling_ratio = (scales[0] > scales[1]) ? scales[1] : scales[0];
        break;
      }
      var resize_factor;
      if(this.effects.zoom[0] == 100) {
        resize_factor = 1;
      } else {
        resize_factor = this.effects.zoom[0] / 100;
      }

      var squash = [this.effects.squash_x[0] / 1000,this.effects.squash_y[0] / 1000];
      var display_dims = [Math.floor(this.dims[0] * scaling_ratio * resize_factor * squash[0]), Math.floor(this.dims[1] * scaling_ratio * resize_factor) * squash[1]];
      var display_offsets = [Math.floor((container_dims[0] - display_dims[0]) / 2) + working_shift[0], Math.floor((container_dims[1] - display_dims[1]) / 2) + working_shift[1]];
      my_image.css({"width":display_dims[0] + "px","height":display_dims[1] + "px","left":display_offsets[0] + "px","top":display_offsets[1] + "px"});
      this.needs_redraw = false;
    }
    my_image.attr("src","clips/" + my_frame.clip + "/" + my_frame.filename + ".jpg");
  }

  set_sequence(seq,frame=0,seeking=true) {
    var my_index = layers.indexOf(this);
    console.log("set_sequence called for layer " + my_index);
    if(this.is_linked && seeking) {
      console.log("layer is linked and we are seeking, so we are moving down one");
      //so here we should recurse down until we reach the layer that is not is_linked (meaning it's the parent layer to the others)
      layers[my_index - 1].set_sequence(seq,layers[my_index - 1].frame_index,true);
      return;
    } else {
      console.log("we are now at a non-linked layer (or seeking is false), so we will set sequence");
      this.frame_index = frame;
      this.sequence = sequences[seq];
      this.sequence_index = seq;
      //this should work because we need to redraw anyhow
      this.dims = [0,0];
      //this.dims = [this.sequence.frames[this.frame_index].dims[0],this.sequence.frames[this.frame_index].dims[1]];
      this.needs_redraw = true;
      console.log("have set sequence for layer " + my_index);
      if(layers[my_index + 1] && layers[my_index + 1].is_linked) {
        console.log("layer " + (my_index + 1) + " is linked... so we should be setting same sequence for that now");
        layers[my_index + 1].set_sequence(seq,layers[my_index + 1].frame_index,false);
      }
    }
  }

  delete_layer() {
    if(layers.length > 1) {
      console.log("# of layers is " + layers.length);
      var my_index = layers.indexOf(this);
      console.log("going to delete myself, I'm at this index: " + my_index);
      $("#container img").eq(my_index).remove();

      $("#layer_selector .control_span").each(function() {
        if($(this).html().indexOf("[" + my_index + "]") != -1) {
          var next_one = $(this).next();
          $(this).remove();
          if($("#layer_selector .control_span.show").length == 0) {
            if(next_one.length == 1) {
              next_one.addClass("show");
            } else {
              $("#layer_selector .control_span").first().addClass("show");
            }
          }
        }
      });

      /*
      $("#layer_selector .control_span").eq((layers.length - 1) - my_index).remove();

      var display_index = layers.length;

      $("#layer_selector .control_span").each(function() {
        display_index --;
        $(this).html("[" + display_index + "]");
      });
      $("#layer_selector .control_span").removeClass("active");
      $("#layer_selector .control_span").first().addClass("active");
      */
      //delete layers[my_index];
      layers.splice(my_index,1);
    } else {
      console.log("theres only one layer so I'm going to init myself");
      $("#container img").attr("src","");
      $("#container img").addClass("hideme");
      this.init();
    }
  }

  set_property(prop,val) {
    var curr_lay = layers.indexOf(this);
    var to_act_on = my_linked_layers(curr_lay);
    console.log("I will act on " + to_act_on.length + " layers");
    for(var n in to_act_on) {
      to_act_on[n][prop] = val;
    }
  }

  set_effect(prop,val) {

    var curr_lay = layers.indexOf(this);
    console.log("Our current layer should be " + curr_lay);
    var to_act_on = my_linked_layers(curr_lay);
    if(prop == "opacity") {
      to_act_on = [layers[curr_lay]];
    }

    console.log("setting effect: " + prop + " " + val);
    console.log("this should affect " + (to_act_on.length) + " layers");
    //val = $.parseJSON("[" + val + "]");
    var valstring = val;
    val = build_effect_vals(val);

    /*
    val = val.split(",");
    var final_val = [];
    for(var n in val) {
      if(val[n].indexOf("x") != -1) {
        var num = parseInt(val[n].split("x")[1]);
        var v = val[n].split("x")[0];
        if(v.indexOf("_") != -1) {
          var firstval = parseInt(v.split("_")[0]);
          var lastval = parseInt(v.split("_")[1]);
          var step = (lastval - firstval) / (num - 1);
          var curr = firstval;
          final_val.push(curr);
          for(var c = 2; c < num; c++) {
            curr += step;
            final_val.push(parseInt(curr));
          }
          final_val.push(lastval);
        } else {
          for(var c = 0; c < num; c++) {
            final_val.push(parseInt(v));
          }
        }
      } else {
        final_val.push(parseInt(val[n]));
      }
    }
    val = final_val;
    */

    console.log("trying to set " + prop + " to " + JSON.stringify(val));

    for(var x in to_act_on) {
      to_act_on[x]["effect_strings"][prop] = valstring;
      to_act_on[x]["effects"][prop] = [];
      for(var n in val) {
        to_act_on[x]["effects"][prop][n] = val[n];
      }
      to_act_on[x]["needs_redraw"] = true;
    }
  }
}

function build_effect_vals(st,r_counter) {
    if(typeof r_counter === "undefined") {
      r_counter = 0;
    }
    r_counter ++;
    if(r_counter > 500) {
      console.log("bleah, too much recursion.");
      return;
    }

    //st - string to parse and convert into array
    //r_counter - counts recursion to catch infinite recursion
    var items = st.split(",");
    var ret = [];
    if(items.length > 1) {
      for(var n in items) {
        ret = ret.concat(build_effect_vals(items[n],r_counter));
      }
    } else {

      //ahhh, no we only want to do this if the string ends in x[0-9]+


      //look for multiplier - if no multiplier then look for series, if no series, look for values . separated
      //if(st.indexOf("x") != -1) {
      if(/x[0-9]+$/.test(st)) {
        var st_arr = st.split("x");
        var mult = st_arr.pop();
        st = st_arr.join("x");
        for(var n = 0; n < mult; n++) {
          ret = ret.concat(build_effect_vals(st,r_counter));
        }
      } else {
        //now lets do the same as above but look for full stops (work like commas)
        if(st.indexOf(".") != -1) {
          var subitems = st.split(".");
          for(var n in subitems) {
            ret = ret.concat(build_effect_vals(subitems[n],r_counter));
          }
        } else {
          //now we know we have either a simple value or a range that we can expand into a series of values
          if(st.indexOf("s") == -1) {
            //finally, we have a simple value, we will return it as a list for concatenation
            ret = [parseInt(st)]
          } else {
            //we have a series of values
            var sp = st.split("s");
            var num = parseInt(sp[1]);
            st = sp[0];
            var firstval = parseInt(st.split("_")[0]);
            var lastval = parseInt(st.split("_")[1]);
            var step = (lastval - firstval) / (num - 1);
            var curr = firstval;
            ret.push(parseInt(curr));
            for(var c = 2; c < num; c++) {
              curr += step;
              ret.push(parseInt(curr));
            }
            ret.push(lastval);
          }
        }
      }
    }
    return ret;
  }


function my_linked_layers(curr_lay) {
  while(layers[curr_lay].is_linked) {
    curr_lay --;
  }
  var ret = [layers[curr_lay]];
  while(layers[curr_lay + 1] && layers[curr_lay + 1].is_linked) {
    curr_lay ++;
    ret.push(layers[curr_lay]);
  }
  return ret;
}

function pad(n,p) {
  n = "" + n;
  pad_needed = p - n.length;
  if(pad_needed == 0) {return n;} else {
      return new Array(pad_needed + 1).join("0") + n;
  }
}

function build_sequences_from_clips() {
  for(var n in all_clips) {
    var clip_name = all_clips[n][0];
    var need_to_add = true;
    for(var x in sequences) {
      if(sequences[x]["name"] == clip_name) {
        need_to_add = false;
      }
    }
    if(need_to_add) {
      var length_in_frames = all_clips[n][1];
      var my_sequence = new Sequence(clip_name);
      var my_dims = [all_clips[n][2],all_clips[n][3]];
      var pad_amount = ("" + length_in_frames).length;
      for(var i = 1; i <= all_clips[n][1]; i++) {
        my_sequence.add_frame(clip_name,pad(i,pad_amount),my_dims);
      }
      sequences[next_master_index()] = my_sequence;
      //sequences.push(my_sequence);
    }
  }
}

var controls_timeout;
function set_controls_timeout() {
  clearTimeout(controls_timeout);
  controls_timeout = setTimeout(function() {
    if(!in_input) {
      $("input").blur();in_input=false;$("#controls").css("display","none");$("#layer_selector").css("display","none");
    } else {
      set_controls_timeout();
    }
  },
  CONTROLS_TIMEOUT_MS);
}


var key_buffer = [];
var key_buffer_timeout;
function add_to_key_buffer(char) {

  if(typeof $("#info").attr("data-restore") === "undefined") {
    $("#info").attr("data-restore",$("#info").html());
  }

  key_buffer.push(char);
  $("#info").html(key_buffer);
  clearTimeout(key_buffer_timeout);
  key_buffer_timeout = setTimeout(function() {
    key_buffer = [];
    if(typeof $("#info").attr("data-restore") !== "undefined") {
      $("#info").html($("#info").attr("data-restore"));
      $("#info").removeAttr("data-restore");
    }
  },KEY_BUFFER_TIMEOUT_MS);
}

var in_input = false;
var reserved_keys = [32,37,38,39,40,13,16,80,27,219,221,189,187,190];
var instant_keys = [32,80,219,221,189,187];
var bad_char_test = RegExp("[^a-z0-9]");

function handle_keypress(key_code,shifted = false) {
  console.log("keypress: " + key_code);
  //maybe we should just do this as if not since we don't want to do anything specific in input
  //if(in_input && key_code != 13 && key_code != 27) {
    //don't do anything but if ESC pressed move out of input
    //we also need to check for Enter either way and then we need to execute function
  //} else {
  if(!in_input || (key_code == 13) || (key_code == 27)) {
    var current_active = $(".control_span.active");
    if($.inArray(key_code,reserved_keys) == -1) {
      //if it's a space that means we want to clear the shortcut
      var typed_char = (key_code == 32) ? "" : String.fromCharCode(key_code).toLowerCase();
      if(shifted) {
        console.log("shifted");
        if(!(bad_char_test.test(typed_char)) && (key_code != 32)) {
          add_to_key_buffer(typed_char);
        } else if(key_code == 32) {
          var my_id = current_active.attr("data-id");
          for(var k in key_shortcuts) {
            console.log("k is " + k);
            if(key_shortcuts[k] == my_id) {
              console.log(" ... matched ");
              delete key_shortcuts[k];
              re_create_controls();
            }
          }
        }

/*     ============================== changing to multi-key shortcuts =======================
        var my_id = current_active.attr("data-id");
        if((typed_char != "") && (typeof key_shortcuts[typed_char] === "undefined")) {
          for(var x in key_shortcuts) {
            if(key_shortcuts[x] == my_id) {
              delete key_shortcuts[x];
              break;
            }
          }
          key_shortcuts[typed_char] = my_id;
          re_create_controls();
        } else if (typed_char == "") {
          for(var x in key_shortcuts) {
            if(key_shortcuts[x] == my_id) {
              delete key_shortcuts[x];
              break;
            }
          }
          re_create_controls();
        }
================================================= */


        /* if(typeof key_shortcuts[typed_char] === "undefined") {
          var my_id = current_active.attr("data-id");
          set_control_property_by_id(my_id,"key_shortcut",typed_char,controls);
          console.log("=== well we should have set that shortcut.... ")
          console.log(JSON.stringify(controls));
          key_shortcuts = {};
          build_key_shortcuts(controls);
          re_create_controls();
        }
      }
      console.log("think typed char is " + typed_char);
      if(typeof key_shortcuts[typed_char] !== "undefined") {
        $("#controls .control_span").removeClass("active").removeClass("show");
        var my_new_active = $(".control_span[data-id=" + key_shortcuts[typed_char] + "]");
        if(my_new_active.hasClass("has_subs")) {
          my_new_active = my_new_active.find(".control_span").first();
        }
        my_new_active.addClass("active");
        my_new_active.parents().addClass("show");
        set_active_per_linked(); */

      } else {
        //not shifted, not in reserved keys - so we assume key shortcut
        if(!bad_char_test.test(typed_char)) {
          add_to_key_buffer(typed_char);
        }
      }

/* ==== old key shortcut way
      } else if (typeof key_shortcuts[typed_char] !== "undefined") {
        $("#controls .control_span").removeClass("active").removeClass("show");
        var my_new_active = $(".control_span[data-id=" + key_shortcuts[typed_char] + "]");
        if(my_new_active.hasClass("has_subs")) {
          my_new_active = my_new_active.find(".control_span").first();
        }
        my_new_active.addClass("active");
        my_new_active.parents().addClass("show");
        set_active_per_linked();
        set_linked_effect_value();
      }
=========================================== */


    } else { //we are in reserved keys so we want to do one of the preset actions (arrow keys etc)
      switch(key_code) {
        /* 37 left - 39 right - 38 up - 40 down */
        case 190: //.
          //force
          do_cycle(true);
        break;
        case 39: //right arrow
          if($("#layer_selector .active").length > 0) {
            $("#layer_selector .control_span.active").removeClass("active").addClass("show");
            $("[data-id=mode]").addClass("active");
          } else if(current_active.find(".control_span").length > 0) {
            current_active.removeClass("active").addClass("show");
            current_active.find(".control_span").first().addClass("active");
          } else if(current_active.children("input").length == 1) {
            current_active.children("input").focus();
            current_active.children("input").select();
            in_input = true;
            current_active.children("input").addClass("live");
          }
          set_linked_effect_value();
        break;
        case 37: //left arrow
          if(current_active.attr("data-id") == "mode") {
            console.log("hmm, global playback mode is " + global_playback_mode);
            if(global_playback_mode == "normal") {
              console.log("we are trying to move out of mode");
              current_active.removeClass("active").removeClass("show");
              $("#layer_selector .control_span.show").addClass("active").removeClass("show");
            }
          }
          if(current_active.parent().hasClass("control_span")) {
            current_active.removeClass("active").removeClass("show");
            current_active.parent().addClass("active");
          }
        break;
        case 38: //up arrow
          current_active.removeClass("active").removeClass("show");
          if(current_active.prev().hasClass("control_span")) {
            current_active.prev().addClass("active");
          } else {
            current_active.parent().children(".control_span").last().addClass("active");
          }
          set_linked_effect_value();
          console.log("current layer: " + current_layer());
          console.log("sequence is null? " + (layers[current_layer()].sequence == null));
          if(layers[current_layer()].sequence != null) {
            $("#info").html(layers[current_layer()].sequence.name);
          } else {
            $("#info").html("None");
          }
        break;
        case 40: //down arrow
          current_active.removeClass("active").removeClass("show");
          if(current_active.next().hasClass("control_span")) {
            current_active.next().addClass("active");
          } else {
            current_active.parent().children(".control_span").first().addClass("active");
          }
          set_linked_effect_value();
          console.log("current layer: " + current_layer());
          if(layers[current_layer()].sequence != null) {

            $("#info").html(layers[current_layer()].sequence.name);
          } else {
            $("#info").html("None");
          }
        break;
        case 13: //Enter
          var my_id = current_active.attr("data-id");
          //if we have key buffer if shifted we want to make a shortcut
          //if not shifted we want to *use* a shortcut
          if(key_buffer.length == 0) {
            for(var x in key_shortcuts) {
              if(key_shortcuts[x] == my_id) {
                delete key_shortcuts[x];
                init_controls();
                break;
              }
            }
          }

          if(key_buffer.length > 0) {
            var keystring = key_buffer.join("");
            if(shifted) {
              if(typeof key_shortcuts[keystring] === "undefined") {
                key_shortcuts[keystring] = my_id;
              }
              key_buffer = [];
              re_create_controls();
            } else {
              if(typeof key_shortcuts[keystring] !== "undefined") {
                key_buffer = [];
                $("#controls .control_span").removeClass("active").removeClass("show");
                var my_new_active = $(".control_span[data-id=" + key_shortcuts[keystring] + "]");
                if(my_new_active.hasClass("has_subs")) {
                  my_new_active = my_new_active.find(".control_span").first();
                }
                my_new_active.addClass("active");
                my_new_active.parents().addClass("show");
                set_active_per_linked();
                set_linked_effect_value();
              }
            }
          } else {
            //do action

            //either this control itself has a function or it has a value to pass to the parent function
            var my_id = current_active.attr("data-id");
            var parent_id = current_active.parent().attr("data-id");
            var my_control = find_control_by_id(my_id,controls[0]);
            var v = "";
            if(in_input) {
              var live_input = $(".live").first();
              v = live_input.val();
              live_input.blur();
              live_input.removeClass("live");
              in_input = false;
            }
            if(typeof my_control.value !== "undefined") {
              v = my_control.value;
            }
            if(typeof my_control.fun === "undefined") {
              my_control = find_control_by_id(parent_id,controls[0]);
            }
            if(typeof my_control.fun !== "undefined") {
              my_control.fun(v);
            } else {
              console.log("couldn't find fun");
            }
          }
        break;
        case 189: //changed from p  to  -
          paused = paused ? false : true;
        break;
        case 27: //esc
        console.log("esc pressed");
        if(in_input) {
          console.log("in input");
          //need to reset the value to the linked effect
          var live_input = $(".live").first();
          if(typeof $("#controls .active").attr("data-linked-layer-effect") !== "undefined") {
            var my_effect = $("#controls .active").attr("data-linked-layer-effect");
            var raw_val = layers[current_layer()]["effects"][my_effect];
            var groomed_val = JSON.stringify(raw_val);
            groomed_val = groomed_val.substr(1,groomed_val.length - 2);
            live_input.val(groomed_val);
          }
          live_input.blur();
          live_input.removeClass("live");
          in_input = false;
        }
        break;
        case 219: //
          console.log("setting loop_points[0] to " + layers[current_layer()].frame_index);
          layers[current_layer()].set_property("loop_points",[layers[current_layer()].frame_index,layers[current_layer()].loop_points[1]]);
          //layers[current_layer()].loop_points[0] = layers[current_layer()].frame_index;
        break;
        case 221: // ]
          console.log("setting loop_points[1] to " + layers[current_layer()].frame_index);
          layers[current_layer()].set_property("loop_points",[layers[current_layer()].loop_points[0],layers[current_layer()].frame_index]);
          //layers[current_layer()].loop_points[1] = layers[current_layer()].frame_index;
        break;
        case 187: // =
          try {
            layers[current_layer()].set_property("loop_points",[0,layers[current_layer()].sequence.frames.length]);
          } catch(e) {
            //who cares
          }
        break;
        case 32: // space bar
          if(global_playback_mode == "state_sequence_manual") {
            console.log("manually advancing state sequence restore_state html is " + restore_state["html"]);
            state_sequence_position ++;
            if(state_sequence_position == state_sequences[current_state_sequence]["states"].length) {
              state_sequence_position = 0;
            }
            load_state(state_sequences[current_state_sequence]["states"][state_sequence_position]);
          }
        break;
      }
    }
  }
}

function do_export() {
  /*    this.type = type;
      this.name = name;
      this.frames = [];
      this.frames_length = 0; */
  var my_saved = {
    "key_shortcuts":key_shortcuts,
    "sequences":{},
    "screen_sequences":{},
    "states":states,
    "state_sequences":state_sequences,
    "master_index":master_index
  };

  //my_saved["key_shortcuts"] = key_shortcuts;
  for(var n in sequences) {
    var my_seq_ob = {
      "name":sequences[n]["name"],
      "type":sequences[n]["type"],
      "frames_length":sequences[n]["frames_length"],
      "frames":compress_frame_sequence(sequences[n]["frames"])
    };
    my_saved["sequences"][n] = my_seq_ob;
  }
  var save_string = JSON.stringify(my_saved);
  save_string = save_string.replace(/"sequences":{/,"\n\n\"sequences\":{").replace(/"screen_sequences":{/,"\n\n\"screen_sequences\":{").replace(/"states":{/,"\n\n\"states\":{").replace(/"state_sequences":{/,"\n\n\"state_sequences\":{").replace(/"master_index":/,"\n\n\"master_index\":").replace(/"screen_sequences":{/,"\n\n\"screen_sequences\":{").replace(/"name":/g,"\n    \"name\":");

  download(save_string, "saved.js", "text/javascript");


/*
  $("body").append("<textarea id=\"export_textarea\">var saved = " + save_string + ";</textarea>");

  $("#export_textarea").css({"position":"fixed","z-index":"1000"});
  $("#export_textarea").select();
  $("#container").css("cursor","default");
  $("#export_textarea").click(function() {
    $(this).remove();
    $("#container").css("cursor","none");
  });
*/

}

function compress_frame_sequence(frame_sequence) {
  frame_sequence = frame_sequence.slice(0);
  var current_total = 0
  for(var i = frame_sequence.length - 1; i > 0; i--) {
      var current_frame = frame_sequence[i];
      var previous_frame = frame_sequence[i-1];
      if((current_frame["clip"] == previous_frame["clip"]) && (parseInt(current_frame["filename"]) == parseInt(previous_frame["filename"]) + 1)) {
        current_total ++;
        frame_sequence.splice(i,1);
      } else {
        frame_sequence.splice(i+1,0,current_total);
        current_total = 0;
      }
      if((i == 1) && (current_total != 0)) {
        frame_sequence[1] = current_total;
      }
  }
  return frame_sequence;
}

function decompress_frame_sequence(frame_sequence) {
  var ind = 1;
  while(ind < frame_sequence.length) {
    if(typeof frame_sequence[ind] === "number") {
      old_frame = frame_sequence[ind-1];
      pad_length = ("" + old_frame.filename).length;
      insert_amount = frame_sequence[ind];
      //remove frame with number
      frame_sequence.splice(ind,1);
      for(var i=1; i<=insert_amount; i++) {
        new_frame = {
          "clip":old_frame["clip"],
          "filename":pad(parseInt(old_frame["filename"]) + i,pad_length),
          "dims":old_frame["dims"]
        }
        frame_sequence.splice(ind + (i - 1),0,new_frame);
      }
      ind += insert_amount;
    } else {
      ind ++;
    }
  }
  return frame_sequence;
}

function set_linked_effect_value() {
  if(typeof $("#controls .active").attr("data-linked-layer-effect") !== "undefined") {
    var my_effect = $("#controls .active").attr("data-linked-layer-effect");

    //we used to get the actual values - now we have a layer of abstraction so we store the string instead

    /* var raw_val = layers[current_layer()]["effects"][my_effect];
    var groomed_val = JSON.stringify(raw_val);
    groomed_val = groomed_val.substr(1,groomed_val.length - 2);

    $("#controls .active").children("input").first().val(groomed_val); */
    $("#controls .active").children("input").first().val(layers[current_layer()]["effect_strings"][my_effect]);
  }
}

function set_active_per_linked() {
  console.log("called set_active_per_linked");
  if(typeof $("#controls .active").attr("data-linked-layer-property") !== "undefined") {
    var my_prop = $("#controls .active").attr("data-linked-layer-property");
    console.log("my_prop: " + my_prop);
    var my_val = layers[current_layer()][my_prop];
    if(typeof my_val === "undefined") {
      my_val = -1;
    }
    if($("#controls_active").hasClass("has_subs")) {
      console.log("my_val: " + my_val);
      if($("#controls .active").attr("data-value") != my_val) {
        var old_active = $("#controls .active");
        old_active.removeClass("active");
        old_active.siblings("[data-value=" + my_val + "]").addClass("active");
      }
    } else {
      $("#controls_active input").first().val(my_val);
    }
  }
}

function current_layer() {
  var raw_index = $("#layer_selector .control_span").index($("#layer_selector .show"));
  if($("#layer_selector .show").length == 0) {
    raw_index = $("#layer_selector .control_span").index($("#layer_selector .active"));
  }
  var len = $("#layer_selector .control_span").length;
  console.log("raw_index is " + raw_index + " and len is " + len);
  console.log("going to return " + ((len - 1) - raw_index));
  return (len - 1) - raw_index;
}

function find_control_by_id(id,con) {
  if (con["id"] == id) {
    return con;
  } else if (typeof con["subs"] !== "undefined") {
    for(var n in con["subs"]) {
      result = find_control_by_id(id,con["subs"][n]);
      if(result) {
        return result;
      }
    }
  }
  return false;
}

function XXset_control_property_by_id(id,prop,val,con) {
  console.log(JSON.stringify(con));
  if (con["id"] == id) {
    con[prop] = val;
    return;
  } else if (typeof con["subs"] !== "undefined") {
    for(var n in con["subs"]) {
      set_control_property_by_id(id,prop,val,con["subs"][n]);
    }
  }
  return;
}

function set_control_property_by_id(id,prop,val,jsonObj) {
    if( jsonObj !== null && typeof jsonObj == "object" ) {
        if(jsonObj["id"] == id) {
          console.log("FOUND IT");
          jsonObj[prop] = val;
        }
        Object.entries(jsonObj).forEach(([key, value]) => {
            // key is either an array index or object key
            set_control_property_by_id(id,prop,val,value);
        });
    }
    return;
}

//cycle = ms between frame advances
var cycle = 200;
//we use cycle counter so some playback can be offset, we will use modulo of the cycle counter
var cycle_counter = 0;
//cycle_interval = time between checks to see if it's time to advance
var cycle_interval = 10;
var last_cycle = 0;
var last_step_cycle = 0;
//for state_sequence
var ss_cycle = 0;


function do_cycle(force=false) {
  if(paused && !force) {return;}
  now_test = new Date().getTime();

  if(((global_playback_mode == "state_sequence_once") || (global_playback_mode == "state_sequence_loop")) && (state_sequence_rate != parseInt(state_sequence_rate)) && (state_sequences[current_state_sequence]["states"].length > 0)) {
    if(ss_cycle == 0) {
      ss_cycle = now_test;
    }
    var timed_rate = parseInt(state_sequence_rate);
    if(state_sequence_rate.indexOf("m") != -1) {
      timed_rate = timed_rate * 60;
    }
    timed_rate = timed_rate * 1000;
    console.log("timed_rate: " + timed_rate);
    if((now_test - ss_cycle) > timed_rate) {
      ss_cycle = now_test;
      console.log("advancing state -- position is now " + state_sequence_position);
      console.log("... now its " + state_sequence_position);
      if(state_sequence_position == state_sequences[current_state_sequence]["states"].length) {
        if(global_playback_mode == "state_sequence_once") {
          unload_state();
          return;
        } else {
          state_sequence_position = 0;
        }
      }
      console.log("should be loading next state (position " + state_sequence_position + "): " + state_sequences[current_state_sequence]["states"][state_sequence_position]);
      load_state(state_sequences[current_state_sequence]["states"][state_sequence_position]);
      state_sequence_position ++;
    }
  }

  if(((now_test - last_cycle) > cycle) || (force)) {
    last_cycle = now_test;
    cycle_counter ++;
    for(var i in layers) {
      if(((cycle_counter + layers[i]["cycle_offset"]) % layers[i]["frame_delay"]) == 0) {
        layers[i].advance_frame();
      }
    }

    if(global_playback_mode == "state_sequence_loop") {
      console.log("SSL");
    }
    if(((global_playback_mode == "state_sequence_once") || (global_playback_mode == "state_sequence_loop")) && (cycle_counter % state_sequence_rate == 0) && (state_sequences[current_state_sequence]["states"].length > 0) && (state_sequence_rate == parseInt(state_sequence_rate))) {
      console.log("advancing state -- position is now " + state_sequence_position);
      console.log("... now its " + state_sequence_position);
      if(state_sequence_position == state_sequences[current_state_sequence]["states"].length) {
        if(global_playback_mode == "state_sequence_once") {
          unload_state();
          return;
        } else {
          state_sequence_position = 0;
        }
      }
      console.log("should be loading next state (position " + state_sequence_position + "): " + state_sequences[current_state_sequence]["states"][state_sequence_position]);
      load_state(state_sequences[current_state_sequence]["states"][state_sequence_position]);
      state_sequence_position ++;
    }
  }

  // we might use this later... it's a convenience for being careful about where to cut copies to create new sequences, buffer etc
  /* if((global_playback_mode == "step") && (((now_test - last_step_cycle) / 1000) > state_sequence_period)) {
    console.log("Should be stepping thru saved now");
    last_step_cycle = now_test;
    load_saved_state(state_sequence[0]);
    state_sequence.push(state_sequence.shift());
  } */
}

function load_state(v) {

  //global_playback_mode = "normal";

/*
  var temp_container = $("<div/>");
  temp_container.html(states[v]["html"]);
  var imgs_needed = temp_container.find("img").length;
  var imgs_existent = $("#container").find("img").length;
  if(imgs_existent < imgs_needed) {
    for(var n = 0; n < (imgs_needed - imgs_existent); n++) {
      $("#container").append("<img src=\"\"/>");
    }
  }
  $("#container img").attr("src","");

  for(var n = 0; n < imgs_needed; n++) {
    $("#container img").eq(n).attr("src",temp_container.find("img").eq(n).attr("src"));
  }
*/

  $("#container").html(states[v]["html"]);

  /* layer_store = [];
  for(var x in layers) {
    layer_store.push(new Layer());
    layer_store[x].copy_layer_properties_from(layers[x]);
  } */

  var saved_layers = states[v]["layers"];
  layers = [];
  $("#layer_selector").html("");
  for(var n in saved_layers) {
    layers.push(new Layer());
    layers[n].copy_layer_properties_from(saved_layers[n]);
    if(layers[n].sequence.frames) {
      layers[n].sequence.frames = decompress_frame_sequence(layers[n].sequence.frames);
    }
    layers[n].needs_redraw = true;
    $("#layer_selector").prepend("<span class=\"control_span\">[" + n + "]</span>");
  }
  $("#layer_selector .control_span").first().addClass("show");
}

function save_state_for_restore() {
  restore_state["html"] = $("#container").html();
  restore_state["layers"] = [];
  for(var x in layers) {
    restore_state["layers"].push(new Layer());
    restore_state["layers"][x].copy_layer_properties_from(layers[x]);
  }
}

function unload_state() {
  global_playback_mode = "normal";
  $("#layer_selector").removeClass("hideme");
  $("#container").html("");
  layers = [];
  if(restore_state["layers"].length > 0) {
    //we restore
    console.log("should be restoring this html: " + restore_state["html"]);
    $("#container").html(restore_state["html"]);
    for(var x in restore_state["layers"]) {
      layers.push(new Layer());
      layers[x].copy_layer_properties_from(restore_state["layers"][x]);
    }
  } else {
    $("#container").html("<img src=\"\"/>");
    layers.push(new Layer());
  }
  $("#layer_selector").html("");
  for(var x in layers) {
    $("#layer_selector").prepend("<span class=\"control_span\">[" + x + "]</span>");
  }
  $("#layer_selector .control_span").first().addClass("show");
}


function insert_blank_layer_above_current() {
  var current_index_raw = $("#layer_selector .control_span").index($("#layer_selector .show"));
  var current_index = (layers.length - 1) - current_index_raw;
  layers.splice(current_index + 1,0,new Layer());
  $("#container img").eq(current_index).after("<img src=\"\"/>");
  $("#layer_selector").html("");
  for(var i = 0; i < layers.length; i++) {
    $("#layer_selector").prepend("<span data-index=\"" + i + "\" class=\"control_span\">[" + i + "]</span>");
  }
  console.log("setting show to " + (current_index_raw + 1));
  $("#layer_selector .control_span").eq(current_index_raw + 1).addClass("show");
}

function insert_blank_layer_below_current() {
  var current_index_raw = $("#layer_selector .control_span").index($("#layer_selector .show"));
  var current_index = (layers.length - 1) - current_index_raw;
  layers.splice(current_index,0,new Layer());
  $("#container img").eq(current_index).before("<img class=\"hideme\" src=\"\"/>");
  $("#layer_selector").html("");
  for(var i = 0; i < layers.length; i++) {
    $("#layer_selector").prepend("<span data-index=\"" + i + "\" class=\"control_span\">[" + i + "]</span>");
  }
  console.log("setting show to " + (current_index_raw));
  $("#layer_selector .control_span").eq(current_index_raw).addClass("show");
}

function rebuild_layer_selector() {
  var cl = current_layer();
  if(cl > layers.length - 1) {
    cl = layers.length - 1;
  }
  $("#layer_selector").html("");
  for(var i=0; i<layers.length; i++) {
    var next_one = "<span class=\"control_span";
    if(i == cl) {next_one += " active";}
    next_one += "\">[" + i + "]</span>";
    $("#layer_selector").prepend(next_one);
  }
}

function renumber_layer_selector() {
  var len = $("#layer_selector .control_span").length;
  for(var n = 0; n < len; n++) {
    $("#layer_selector .control_span").eq(n).html("[" + ((len - 1) - n) + "]");
  }
}





//in ms
var last_beat = 0;
var beats_clicked = [];
var min_interval = 100;
var beat_interval = 10;
var beat_timeout = 3000;

function set_beat() {
  console.log("setting beat");
  var now_test = new Date().getTime();

  if(last_beat == 0) {
    last_beat = now_test;
    return;
  } else {
    var my_int = now_test - last_beat;
    last_beat = now_test;
    if(my_int > beat_timeout) {
      last_beat = now_test;
      beats_clicked = [];
    } else if(my_int > min_interval) {
      //now we want to add it to our list
      beats_clicked.push(my_int);
      var beats_total = 0;
      for(var b in beats_clicked) {
        beats_total += beats_clicked[b];
      }
      cycle = (beats_total / beats_clicked.length) / 8;
    }
  }
}

function next_master_index() {
  var curr = master_index;
  master_index ++;
  return curr;
}


$(document).ready(function() {

  console.log("document load restore_state html is " + restore_state["html"]);

  if(!$.isEmptyObject(saved["key_shortcuts"])) {
    key_shortcuts = saved["key_shortcuts"];
  }

  if(typeof saved["master_index"] !== "undefined") {
    master_index = saved["master_index"];
  }

  console.log("trying to restore states:");
  console.log(JSON.stringify(saved["states"]));
  states = saved["states"];

  //doing this for backward compatibility before we had complicated strings to set effects
  for(var n in states) {
    for(var x in states[n]["layers"]) {
      if(!(states[n]["layers"][x]["effect_strings"])) {
        states[n]["layers"][x]["effect_strings"] = {};
        for(var nam in states[n]["layers"][x]["effects"]) {
          states[n]["layers"][x]["effect_strings"][nam] = states[n]["layers"][x]["effects"][nam].join(",");
        }
      }
    }
  }

  state_sequences = saved["state_sequences"];
  screen_sequences = saved["screen_sequences"];

  if($.isArray(saved["sequences"])) {
    var new_saved_sequences = {};
    for(var n in saved["sequences"]) {
      new_saved_sequences[next_master_index()] = saved["sequences"][n];
    }
    saved["sequences"] = new_saved_sequences;
  }

  for(var n in saved["sequences"]) {
    sequences[n] = saved["sequences"][n];
    sequences[n]["frames"] = decompress_frame_sequence(sequences[n]["frames"]);
  }

  for(var n in states) {
    if(typeof states[n]["index"] === "undefined") {
      states[n]["index"] = next_master_index();
    }
  }

  for(var n in state_sequences) {
    if(typeof state_sequences[n]["index"] === "undefined") {
      state_sequences[n]["index"] = next_master_index();
    }
  }

  for(var n in screen_sequences) {
    if(typeof screen_sequences[n]["index"] === "undefined") {
      screen_sequences[n]["index"] = next_master_index();
    }
  }

  //this function will check if the sequence is already built from that clip
  build_sequences_from_clips();

  init_controls();

  layers.push(new Layer());

  $("body").keyup(function(e) {
    var key_code = e.which;
    if((key_code == 222) || (key_code == 220)) {
      set_beat();
    } else {
      if($("#controls").css("display") == "none") {
        $("#controls").css("display","block");
        $("#layer_selector").css("display","block");
        var bad_char_test = RegExp("[^a-zA-Z0-9]");
        if(!bad_char_test.test(String.fromCharCode(key_code)) || ($.inArray(key_code,instant_keys) != -1)) {
          handle_keypress(key_code, e.shiftKey);
        }
      } else {
        handle_keypress(key_code, e.shiftKey);
      }
      set_controls_timeout();
    }
  });
  setInterval(do_cycle,cycle_interval);
  $(window).resize(function() {
    do_resize();
  });
  do_resize();
});

function do_resize() {
  var win_dims = [$(window).width(),$(window).height()];
  $("#container").css({"width":(win_dims[0] - 10) + "px","height":(win_dims[1] - 50) + "px"});
  $("#control_container").css("width",$("#container").css("width"));
  for(var n in layers) {
    layers[n].needs_redraw = true;
  }
}

/*
$(document).ready(function() {
  my_con = find_control_by_id("sequence",controls[0]);
  alert(my_con["id"]);
});
*/

function preload_all_images() {
  preload_image(0,1);
  $("#info").html("Done loading.");
}

function preload_image(clip_index,frame_index) {
  if(clip_index > all_clips.length) {
    return;
  } else {
    $("#info").html("Loading frames from " + all_clips[clip_index][0] + "...");
    var last_frame = all_clips[clip_index][1];
    if(frame_index > last_frame) {
      preload_image(clip_index + 1,1);
    } else {
      var fn = "clips/" + all_clips[clip_index][0] + "/" + pad(frame_index,("" + last_frame).length) + ".jpg";
      /* var my_img = $("<img/>");
      my_img[0].src = fn;
      my_img.on("load", function() {
        preload_image(clip_index,frame_index + 1);
      }); */

      $("<img/>")
      .on('load', function() { preload_image(clip_index,frame_index + 1)})
      .on('error', function() { console.log("error loading image, skipping to next clip");
      preload_image(clip_index + 1,1);
     })
      .attr("src", fn);
    ;

    }
  }
}
