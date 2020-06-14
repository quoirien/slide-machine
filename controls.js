//we want to build our control html hierarchy based on hierarchy here, then add handlers etc.
//for each control we could get values from somewhere else so these menus can update based on live changes

var controls = [];

var key_shortcuts = {
  "m":"mode",
  "s":"sequence"
};

//each control must have label, id, key_shortcut
//then they either have subs (subcontrols) or fun (function to execute when selected with enter)
function init_controls() {
  controls = [
    {
      "label":"Mode",
      "id":"mode",
      "key_shortcut":"m",
      "subs":[
        {
          "label":"This Layer",
          "id":"this_layer",
          "subs":[
            {
              "label":"Sequence",
              "id":"sequence",
              "key_shortcut":"s",
              "subs":function() {
                var ret = [{
                  "label":"None",
                  "id":"sequence-none",
                  "linked_layer_property":["sequence_index"],
                  "value":-1
                }];
                for(var ind in sequences) {
                  ret.push({
                    "label":sequences[ind]["name"],
                    "id":"sequence-" + ind,
                    "linked_layer_property":["sequence_index"],
                    "value":ind
                  });
                }
                return ret;
              }(),
              "fun":function(v) {
                if(v == -1) {
                  layers[current_layer()].clear_sequence();
                } else {
                  layers[current_layer()].set_sequence(parseInt(v));
                }
              }
            },
            {
              "label":"Playback Settings",
              "id":"playback_settings",
              "subs":[
                {
                  "label":"Frame Delay",
                  "id":"frame_delay",
                  "linked_layer_property":"frame_delay",
                  "input":"input",
                  "fun":function(v) {
                    v = parseInt(v);
                    if(v < 1) {v == 1;}
                    //layers[current_layer()].frame_delay = v;
                    layers[current_layer()].set_property("frame_delay",v);
                  }
                },
                {
                  "label":"Frame Advance",
                  "id":"frame_advance",
                  "linked_layer_property":"frame_advance",
                  "input":"input",
                  "fun":function(v) {
                    v = parseInt(v);
                    if(v < 0) {v == 0;}
                    //layers[current_layer()].frame_advance = v;
                    layers[current_layer()].set_property("frame_advance",v);
                  }
                },
                {
                  "label":"Playback Mode",
                  "id":"playback_mode",
                  "linked_layer_property":"playback_mode",
                  "subs":[
                    {
                      "label":"Normal",
                      "id":"playback_mode_normal",
                      "value":"normal"
                    },
                    {
                      "label":"Reverse",
                      "id":"playback_mode_reverse",
                      "value":"reverse"
                    },
                    {
                      "label":"Random",
                      "id":"playback_mode_random",
                      "value":"random"
                    },
                    {
                      "label":"Loop Repeat",
                      "id":"playback_mode_loop_repeat",
                      "value":"loop_repeat"
                    },
                    {
                      "label":"Loop Bounce",
                      "id":"playback_mode_loop_bounce",
                      "value":"loop_bounce"
                    }
                  ],
                  "fun":function(v) {
                    console.log("should be setting " + current_layer() + " to playback_mode of " + v);
                    //layers[current_layer()].playback_mode = v;
                    layers[current_layer()].set_property("playback_mode",v);
                  }
                },
                {
                  "label":"Playback Pattern",
                  "id":"playback_pattern",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    layers[current_layer()].set_property("playback_pattern",v);
                  }
                },
                {
                  "label":"Clear Loop Points",
                  "id":"clear_loop_points",
                  "fun":function(v) {
                    //layers[current_layer()].loop_points = [0,this.sequence.frames.length - 1];
                    layers[current_layer()].set_property("loop_points",[0,this.sequence.frames.length - 1]);
                  }
                },
                {
                  "label":"Clear Loop Points and Playback Normal",
                  "id":"clear_loop_points_and_normal",
                  "fun":function(v) {
                    //layers[current_layer()].loop_points = [0,this.sequence.frames.length - 1];
                    layers[current_layer()].set_property("loop_points",[0,this.sequence.frames.length - 1]);
                    //layers[current_layer()].playback_mode = "normal";
                    layers[current_layer()].set_property("playback_mode","normal");
                  }
                }
              ]
            },
            {
              "label":"Effects",
              "id":"effects",
              "subs":[
                {
                  "label":"Zoom",
                  "id":"zoom",
                  "linked_layer_effect":"zoom",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    //layers[current_layer()].effects.zoom = v;
                    layers[current_layer()].set_effect("zoom",v);
                    //layers[current_layer()].needs_redraw = true;
                  }
                },
                {
                  "label":"Opacity",
                  "id":"opacity",
                  "linked_layer_effect":"opacity",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    layers[current_layer()].effects.opacity = v;
                    layers[current_layer()].needs_redraw = true;
                  }
                },
                {
                  "label":"Shift-X",
                  "id":"shift-x",
                  "linked_layer_effect":"shift_x",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    layers[current_layer()].set_effect("shift_x",v);
                    //layers[current_layer()].effects.shift_x = v;
                    layers[current_layer()].needs_redraw = true;
                  }
                },
                {
                  "label":"Shift-Y",
                  "id":"shift-y",
                  "linked_layer_effect":"shift_y",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    layers[current_layer()].set_effect("shift_y",v);
                    //layers[current_layer()].effects.shift_y = v;
                    layers[current_layer()].needs_redraw = true;
                  }
                },
                {
                  "label":"Flash",
                  "id":"flash",
                  "linked_layer_effect":"flash",
                  "input":"input",
                  "fun":function(v) {
                    v = $.parseJSON("[" + v + "]");
                    layers[current_layer()].set_effect("flash",v);
                    //layers[current_layer()].effects.flash = v;
                    layers[current_layer()].needs_redraw = true;
                  }
                },
                {
                  "label":"Orientation",
                  "id":"orientation",
                  "subs":[
                    {
                      "label":"Normal",
                      "id":"orientation-normal",
                      "value":"normal"
                    },
                    {
                      "label":"Flip X",
                      "id":"orientation-flipx",
                      "value":"flipx"
                    },
                    {
                      "label":"Flip Y",
                      "id":"orientation-flipy",
                      "value":"flipy"
                    },
                    {
                      "label":"Flip Both",
                      "id":"orientation-flipboth",
                      "value":"flipboth"
                    }
                  ],
                  "fun":function(v) {
                    var my_current = layers[current_layer()];
                    my_current.effects.orientation = v;
                    my_current.needs_redraw = true;
                   }
                }
              ]
            },
            {
              "label":"Special Effects",
              "id":"special-effects",
              "subs":[
                {
                  "label":"Transreflect Horizontal",
                  "id":"trans-horizontal",
                  "fun":function(v) {
                    delete_the_linked_layers(current_layer());
                    insert_blank_layer_above_current();
                    var orig_layer = layers[current_layer()];
                    var new_layer = layers[current_layer() + 1];
                    new_layer.copy_layer_properties_from(layers[current_layer()]);
                    new_layer.effects.orientation = "flipx";
                    for(var n in orig_layer.effects.opacity) {
                      new_layer.effects.opacity[n] = Math.floor(orig_layer.effects.opacity[n] / 2);
                    }
                    new_layer.is_linked = true;
                  }
                },
                {
                  "label":"Transreflect Vertical",
                  "id":"trans-vertical",
                  "fun":function(v) {
                    delete_the_linked_layers(current_layer());
                    insert_blank_layer_above_current();
                    var orig_layer = layers[current_layer()];
                    var new_layer = layers[current_layer() + 1];
                    new_layer.copy_layer_properties_from(layers[current_layer()]);
                    new_layer.effects.orientation = "flipy";
                    for(var n in orig_layer.effects.opacity) {
                      new_layer.effects.opacity[n] = Math.floor(orig_layer.effects.opacity[n] / 2);
                    }
                    new_layer.is_linked = true;
                  }
                },
                {
                  "label":"Transreflect Horiz and Vert",
                  "id":"trans-both",
                  "fun":function(v) {
                    delete_the_linked_layers(current_layer());
                    insert_blank_layer_above_current();
                    insert_blank_layer_above_current();
                    insert_blank_layer_above_current();
                    var orig_layer = layers[current_layer()];
                    var new_layer;
                    console.log("doing effect... current layer is " + current_layer());
                    for(var i = 1; i < 4; i++) {
                      var new_layer_ind = current_layer() + i;
                      console.log("new layer ind is " + i);
                      new_layer = layers[new_layer_ind];
                      new_layer.copy_layer_properties_from(layers[current_layer()]);
                      switch(i) {
                        case 1:
                          new_layer.effects.orientation = "flipx";
                        break;
                        case 2:
                          new_layer.effects.orientation = "flipy";
                        break;
                        case 3:
                          new_layer.effects.orientation = "flipboth";
                        break;
                      }
                      for(var n in orig_layer.effects.opacity) {
                        var new_opacity = orig_layer.effects.opacity[n] / (i + 1);
                        new_layer.effects.opacity[n] = Math.floor(new_opacity);
                      }
                      new_layer.is_linked = true;
                      new_layer.needs_redraw = true;
                    }
                  }
                },
                {
                  "label":"Trails (#, distance)",
                  "id":"trails",
                  "input":"input",
                  "fun":function(v) {
                    delete_the_linked_layers(current_layer());
                    var my_params = $.parseJSON("[" + v + "]");
                    v = parseInt(my_params[0]);
                    var dist = my_params[1];
                    if(v > 20) {v = 20;}
                    for(var i = 1; i < v; i++) {
                      insert_blank_layer_above_current();
                    }
                    var orig_layer = layers[current_layer()];
                    var new_layer;
                    console.log("doing effect... current layer is " + current_layer());
                    for(var i = 1; i < v; i++) {
                      var new_layer_ind = current_layer() + i;
                      console.log("new layer ind is " + i);
                      new_layer = layers[new_layer_ind];
                      new_layer.copy_layer_properties_from(layers[current_layer()]);
                      /* switch(i) {
                        case 1:
                          new_layer.effects.orientation = "flipx";
                        break;
                        case 2:
                          new_layer.effects.orientation = "flipy";
                        break;
                        case 3:
                          new_layer.effects.orientation = "flipboth";
                        break;
                      } */
                      for(var n in orig_layer.effects.opacity) {
                        var new_opacity = orig_layer.effects.opacity[n] / (i + 1);
                        new_layer.effects.opacity[n] = Math.floor(new_opacity);
                      }
                      for(var x = 0; x < (i * dist); x++) {
                        new_layer.advance_frame();
                      }
                      new_layer.is_linked = true;
                      new_layer.needs_redraw = true;
                    }
                  },
                  "funx":function(v) {
                    v = parseInt(v);
                    if(v > 8) {v = 8;}
                    //we need to make v number of copies
                    var curr = current_layer();
                    var orig_layer = layers[curr];
                    for(var i = 0; i < v; i++) {
                      insert_blank_layer_above_current();
                    }
                    for(var i = 0; i < v; i++) {
                      var new_layer = layers[curr + i + 1];
                      new_layer.copy_layer_properties_from(layers[current_layer()]);
                      for(var x = 0; x < (i + 1); x++) {
                        new_layer.advance_frame();
                      }
                      for(var n in orig_layer.effects.opacity) {
                        new_layer.effects.opacity[n] = Math.floor(orig_layer.effects.opacity[n] / (i + 2));
                      }
                      new_layer.is_linked = true;
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "label":"Layer Control",
          "id":"layer_control",
          "subs":[
            {
              "label":"Delete Current Layer",
              "id":"delete_current_layer",
              "fun":function() {
                var curr_lay = current_layer();
                while(curr_lay < layers.length - 1) {
                  if(layers[curr_lay + 1].is_linked) {
                    console.log("next one up is linked, moving up");
                    curr_lay += 1;
                  } else {
                    break;
                  }
                }
                while(layers[curr_lay].is_linked) {
                  layers[curr_lay].delete_layer();
                  //delete layers[curr_lay];
                  //$("#container img").eq(curr_lay).remove();
                  curr_lay --;
                }
                console.log("deleted linked, now my layer is " + curr_lay);
                layers[curr_lay].delete_layer();
                //delete layers[curr_lay];
                //$("#container img").eq(curr_lay).remove();
                //rebuild_layer_selector();
                renumber_layer_selector();
              }
            },
            {
              "label":"Delete Current Linked Layers",
              "id":"delete_current_linked_layers",
              "fun":function(v) {
                var curr_lay = current_layer();
                delete_the_linked_layers(curr_lay);
              }
            },
            {
              "label":"Insert Blank Layer Above Current",
              "id":"insert_blank_layer_above_current",
              "fun":function() {
                insert_blank_layer_above_current();
                console.log("any show? " + $("#layer_control .control_span.show").length);
                $("#layer_selector .control_span.show").prev().addClass("show");
                $("#layer_selector .control_span.show").eq(1).removeClass("show");
                $("#info").html("None");
              }
            },
            {
              "label":"Insert Blank Layer Below Current",
              "id":"insert_blank_layer_below_current",
              "fun":function() {
                insert_blank_layer_below_current();
                $("#layer_selector .control_span.show").next().addClass("show");
                $("#layer_selector .control_span.show").first().removeClass("show");
                $("#info").html("None");
              }
            }
          ]
        },
        {
          "label":"Global",
          "id":"global",
          "subs":[
            {
              "label":"Export",
              "id":"export",
              "fun":function() {
                do_export();
              }
            },
            {
              "label":"Reset",
              "id":"reset",
              "fun":function() {
                $("#layer_selector").html("<span class=\"control_span show\">[0]</span>");
                layers = [];
                layers.push(new Layer());
                global_playback_mode = "normal";
                $("#container").html("<img src=\"\"/>");
              }
            },
            {
              "label":"States",
              "id":"states",
              "subs":[
                {
                  "label":"Save State",
                  "id":"save_state",
                  "input":"input",
                  "fun":function(v) {
                    var my_state = {"name":v};
                    my_state["html"] = $("#container").html();
                    my_state["layers"] = [];
                    for(var n in layers) {
                      my_state["layers"].push(new Layer());
                      my_state["layers"][n].copy_layer_properties_from(layers[n]);
                      if(my_state["layers"][n].sequence.frames) {
                        my_state["layers"][n].sequence.frames = compress_frame_sequence(my_state["layers"][n].sequence.frames);
                      }
                    }
                    my_state["index"] = next_master_index();
                    states.push(my_state);
                    console.log(JSON.stringify(states));
                    init_controls();
                    //re_create_controls();
                  }
                },
                {
                  "label":"Load State",
                  "id":"load_state",
                  "fun":function(v) {
                    v = parseInt(v);
                    save_state_for_restore();
                    global_playback_mode = "normal";
                    $("#layer_selector").removeClass("hideme");
                    load_state(v);
                    /* $("#container").html("");
                    $("#container").html(states[v]["html"]);
                    var saved_layers = states[v]["layers"];
                    layers = [];
                    for(var n in saved_layers) {
                      layers.push(new Layer());
                      layers[n].copy_layer_properties_from(saved_layers[n]);
                      if(layers[n].sequence.frames) {
                        layers[n].sequence.frames = decompress_frame_sequence(layers[n].sequence.frames);
                      }
                    } */
                  },
                  "subs":
                    function() {
                    var ret = [];
                    for(var ind in states) {
                      ret.push({
                        "label":states[ind]["name"],
                        "id":"state-" + ind,
                        "value":ind
                        });
                      }
                    return ret;
                  }()
                },
                {
                  "label":"Unload State",
                  "id":"unload_state",
                  "fun":function(v) {
                    unload_state();
                  }
                },
                {
                  "label":"New State Sequence",
                  "id":"new_state_sequence",
                  "input":"input",
                  "fun":function(v) {
                    state_sequences.push({
                      "name":v,
                      "index":next_master_index(),
                      "states":[]
                    });
                    init_controls();
                  }
                },
                {
                  "label":"Set State Sequence Rate (1 = fastest)",
                  "id":"set_state_sequence_rate",
                  "input":"input",
                  "fun":function(v) {
                    v = parseInt(v);
                    if(v >= 1) {
                      state_sequence_rate = v;
                    }
                  }
                },
                {
                  "label":"Play State Sequence Once",
                  "id":"play_state_sequence_once",
                  "fun":function(v) {
                    save_state_for_restore();
                    $("#layer_selector").addClass("hideme");
                    current_state_sequence = v;
                    state_sequence_position = 0;
                    global_playback_mode = "state_sequence_once";
                    if(state_sequences[v]["states"].length > 0) {
                      load_state(state_sequences[v]["states"][0]);
                    }
                  },
                  "subs":function() {
                    var ret = [];
                    for(var n in state_sequences) {
                      ret.push({
                        "label":state_sequences[n]["name"],
                        "id":"state_sequence_once_select_" + n,
                        "value":n
                      });
                    }
                    return ret;
                  }()
                },
                {
                  "label":"Play State Sequence Loop",
                  "id":"play_state_sequence_loop",
                  "fun":function(v) {
                    save_state_for_restore();
                    $("#layer_selector").addClass("hideme");
                    current_state_sequence = v;
                    state_sequence_position = 0;
                    global_playback_mode = "state_sequence_loop";
                    if(state_sequences[v]["states"].length > 0) {
                      load_state(state_sequences[v]["state"][0]);
                    }
                  },
                  "subs":function() {
                    var ret = [];
                    for(var n in state_sequences) {
                      ret.push({
                        "label":state_sequences[n]["name"],
                        "id":"state_sequence_loop_select_" + n,
                        "value":n
                      });
                    }
                    return ret;
                  }()
                },
                {
                  "label":"Play State Sequence Manual Advance",
                  "id":"play_state_sequence_manual",
                  "fun":function(v) {
                    save_state_for_restore();
                    current_state_sequence = v;
                    state_sequence_position = 0;
                    global_playback_mode = "state_sequence_manual";
                    if(state_sequences[v]["states"].length > 0) {
                      load_state(state_sequences[v]["states"][0]);
                    }
                  },
                  "subs":function() {
                    var ret = [];
                    for(var n in state_sequences) {
                      ret.push({
                        "label":state_sequences[n]["name"],
                        "id":"state_sequence_manual_select_" + n,
                        "value":n
                      });
                    }
                    return ret;
                  }()
                },
                {
                  "label":"Add State to Current State Sequence",
                  "id":"add_state_to_current",
                  "fun":function(v) {
                    console.log("should be adding " + v + " to " + current_state_sequence);
                    if(current_state_sequence > -1) {
                      state_sequences[current_state_sequence]["states"].push(v);
                    }
                  },
                  "subs":function() {
                    var ret = [];
                    for(var n in states) {
                      ret.push({
                        "label":states[n]["name"],
                        "id":"select_state_to_add_" + n,
                        "value":n
                      });
                    }
                    return ret;
                  }()
                }
              ]
            },
            {
              "label":"Buffer",
              "id":"buffer",
              "subs":[
                {
                  "label":"Start/Stop Recording",
                  "id":"start_stop_recording",
                  "fun":function() {
                    recording = recording ? false : true;
                    if(recording) {$("#rec").addClass("recording");} else {$("#rec").removeClass("recording");}
                    if(!recording) {
                      console.log(JSON.stringify(buffer));
                    }
                  }
                },
                {
                  "label":"Save Buffer to New Sequence",
                  "id":"save_buffer_to_new_sequence",
                  "input":"input",
                  "fun":function(v) {
                    var my_sequence = new Sequence(v);
                    my_sequence.frames_length = buffer.length;
                    my_sequence.frames = buffer.slice(0);
                    console.log(JSON.stringify(my_sequence));
                    sequences.push(my_sequence);
                    init_controls();
                    return;
                  }
                },
                {
                  "label":"Append Buffer to Existing Sequence",
                  "id":"append_buffer_to_existing_sequence",
                  "subs":function() {
                    var ret = [];
                    for(var ind in sequences) {
                      ret.push({
                        "label":sequences[ind]["name"],
                        "id":"sequence-" + ind,
                        "linked_layer_property":["sequence_index"],
                        "value":ind
                      });
                    }
                    return ret;
                  }(),
                  "fun":function(v) {
                    sequences[v].frames = sequences[v].frames.concat(buffer);
                  }
                },
                {
                  "label":"Clear Buffer",
                  "id":"clear_buffer",
                  "fun":function() {
                    recording = false;
                    buffer = [];
                  }
                }
              ]
            }
          ]
        }
      ]
    },
  ];

  //have to use recursion for building key shortcuts and onscreen because we have to make sure to transverse the whole object

  //build_key_shortcuts(controls);
  re_create_controls();
}

function delete_the_linked_layers(curr_lay) {
  console.log("deleting linked layers");
  while(curr_lay < layers.length - 1) {
    if(layers[curr_lay + 1].is_linked) {
      console.log("next one up is linked, moving up");
      curr_lay += 1;
    } else {
      break;
    }
  }
  console.log("should have found my top linked layer: " + curr_lay);
  console.log("my layer:");
  console.log(JSON.stringify(layers[curr_lay]));
  while(layers[curr_lay].is_linked) {
    console.log("this one (" + curr_lay + ") is liked.")
    layers[curr_lay].delete_layer();
    //delete layers[curr_lay];
    //$("#container img").eq(curr_lay).remove();
    curr_lay --;
  }
}

function re_create_controls() {
  var my_id = "";

  if($("#controls .control_span.active").length > 0) {

    my_id = $("#controls .control_span.active").attr("data-id");
  }

  console.log("my_id is " + my_id);

  var my_controls_html = build_onscreen_controls(controls);
  $("#controls").html(my_controls_html);

  if(my_id != "") {
    $("[data-id=" + my_id + "]").addClass("active");
  } else {
    $(".control_span .control_span").first().addClass("active");
  }
  $(".control_span.active").parents(".control_span").addClass("show");
  //we want to show the relevant sub if there is a relevant one i.e. if its sequences we want to show the current one for this layer, no?
}

function build_key_shortcuts(controls) {
  //key_shortcuts = {};
  for(var n in controls) {
    var my_shortcut = controls[n]["key_shortcut"];
    console.log("ks my id is " + controls[n]["id"] + " and ks is " + my_shortcut);
    if(my_shortcut != "") {
      key_shortcuts[my_shortcut] = controls[n]["id"];
    } else {
      console.log("its empty so no shortcut created");
    }
    if(typeof controls[n]["subs"] !== "undefined") {
      build_key_shortcuts(controls[n]["subs"]);
    }
  }
}

function build_onscreen_controls(controls) {
  var controls_html = "";
  for(var n in controls) {
    controls_html += "<span class=\"control_span";
    if(typeof controls[n]["subs"] !== "undefined") {
      controls_html += " has_subs";
    }
    controls_html += "\"";
    if(typeof controls[n]["value"] !== "undefined") {
      controls_html += "data-value=\"" + controls[n]["value"] + "\"";
    }
    if(typeof controls[n]["linked_layer_property"] !== "undefined") {
      controls_html += " data-linked-layer-property=\"" + controls[n]["linked_layer_property"] + "\"";
    }
    if(typeof controls[n]["linked_layer_effect"] !== "undefined") {
      controls_html += " data-linked-layer-effect=\"" + controls[n]["linked_layer_effect"] + "\"";
    }
    controls_html += " data-id=\"" + controls[n]["id"] + "\">" + controls[n]["label"];
    for(var x in key_shortcuts) {
      if(key_shortcuts[x] == controls[n]["id"]) {
        controls_html += " (" + x + ")";
      }
    }

    /* if((typeof controls[n]["key_shortcut"] !== "undefined") && (controls[n]["key_shortcut"] != "")) {
      controls_html += " (" + controls[n]["key_shortcut"] + ")";
    } */
    if(typeof controls[n]["subs"] !== "undefined") {
      controls_html += " >";
      controls_html += build_onscreen_controls(controls[n]["subs"]);
    }

    if(typeof controls[n]["input"] !== "undefined") {
      if(controls[n]["input"] == "input") {
        controls_html += " <input type=\"text\"/>";
      }
    }
    controls_html += "</span>";
  }
  return controls_html;
}


//when we are actually navigating we can just brute force look for certain ids and act accordingly - so for instance if our current id is "sequence" we can jump to the current sequence
