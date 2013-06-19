/*
 * Copyright (c) 2012, Daniel Walton (daniel@belteshazzar.com)
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

  var URL = 'www.ckwnc.com';
  var URL = 'ckwnc.localhost';
   
  var D0 = [ "me:Actor",
                  ":Proxy",
                  "Proxy>create()",
                  "{",
                  "  Client.do()",
                  "}",
                  "Proxy>ajax ()",
                  "{",
                  "  me.callback()",
                  "}"].join( "\n" ); 
    var D1 = [ "steve>sent() { boo() } steve>go()"].join( "\n" ); 
    var D2 = [ "steve>sent() { boo() }"].join( "\n" );
    
    var DEFAULT = D0;

 //Popup dialog
 function popup(message)
 {    
   // get the screen height and width  
   var maskHeight = $(document).height();  
   var maskWidth = $(window).width();
   
   // calculate the values for center alignment
   var dialogTop =  160; // Math.max( 100, 40 + (maskHeight/2) - ($('#dialog-box').height()) );  
   var dialogLeft = (maskWidth/2) - ($('#dialog-box').width()/2); 
   
   // assign values to the overlay and dialog box
   $('#dialog-overlay').css({height:maskHeight, width:maskWidth}).show();
   $('#dialog-box').css({top:dialogTop, left:dialogLeft}).show();
   
   // display the message
   if ( message ) $('#dialog-message').html(message);    
 }
    
var canvas = null;
var editor = null;
var scroller;
var hlLine;
var errors;

var STATE_LOADING = 0;
var STATE_DISPLAY = 1;
var STATE_EDITING = 2;
var STATE_TRANSITION_TO_EDIT = 3;
var STATE_SAVING = 4;

var state = STATE_LOADING;
    
function image()
{
   if ( canvas!=null ) 
   {
      var img = canvas.toDataURL("image/png");
      var win = window.open("", "_blank");
      win.document.write("<img src=\""+img+"\"/>");
   }
}

function editOrSave()
{
   if ( state==STATE_DISPLAY )
   {
     state = STATE_TRANSITION_TO_EDIT;
      $("#diagram").animate({ width: "50%" }, 500, function() { 
        $("#editOrSave").attr("src", "img/save_as.png");
        $("#editOrSaveText").text("save");
         state = STATE_EDITING;
      });
   }
   else if ( state==STATE_EDITING )
   {
      popup("saving ...");
     state = STATE_SAVING;
      $.ajax({
         url: 'http://'+URL+'/ckwnc.php',
         type: 'POST',
         data: { "code": editor.getValue() },
         dataType: 'json',
         error: function(request,text,error) {
           state = STATE_DISPLAY;
           popup("an error occured saving the diagram "+ text + " "+error  + "'<a href=\"#\" class=\"button\">Close</a>");
         },
         success: function(data,text,request) {
      $("#diagram").animate({ width: "100%" }, 500, function() { 
        $("#editOrSave").attr("src", "img/edit.png");
            $("#editOrSaveText").text("edit");
            state = STATE_DISPLAY;
            window.location.hash = data.id;
      });
         }
      });
   }
}

function help()
{
   window.open("help.html");
}

function resize()
{
   $("#main").height( $(window).height()-80);
   if ( editor!=null )
   {
      scroller.style.height = ( $(window).height()-80 ) + "px";
      editor.refresh();
   }
   $('#dialog-overlay').css({height:$(window).height()});

   if (!$('#dialog-box').is(':hidden')) popup();      
}

function getDiagram( id )
{
   initEditor();

   state = STATE_LOADING;
   if ( id=="" )
   {
     editor.setValue(DEFAULT);
     resize();
     $('#dialog-overlay, #dialog-box').fadeOut("slow");
     state = STATE_DISPLAY;
  }
  else
  {
     $.ajax({
        url: 'http://'+URL+'/ckwnc.php',
        type: 'GET',
        data: { "id": id },
        dataType: 'json',
        error: function(request,text,error)
        {
           popup("oops, an error has occured loading diagram '" + id + "'<a href=\"#\" class=\"button\">Close</a>");
        },
        success: function(data,text,request)
        {
           editor.setValue(data.code);
           resize();
           $('#dialog-overlay, #dialog-box').fadeOut("slow");
           state = STATE_DISPLAY;
        }
     });
  }
}

function initEditor()
{
   $("#editor").empty();
     editor = CodeMirror(document.getElementById("editor"),{
      mode: "text/x-csrc",
      lineNumbers: true,
      lineWrapping: false,
      onCursorActivity: function()
      {
        editor.setLineClass(hlLine, null, null);
        hlLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
      },
      onChange : function()
      {
         if ( canvas!=null ) 
         {
            $(canvas).remove();
            canvas = null;
         }
         if ( errors != null )
         {
            $("#error-message").hide();
            for ( var i=0 ; i<errors.length ; i++ ) editor.setMarker(errors[i].getRow()-1, null,null);
            errors = null;
         }

         var result = ckwnc.generate( editor.getValue() );
         if ( result instanceof Array )
         {
            for ( var i=0 ; i<result.length ; i++ )
            {
               editor.setMarker(result[i].getRow()-1, "%N%","errorline");
            }
            errors = result;
            $(".errorline").mouseover( function()
            {
               
               var ln = $(this).text();
               var msg = null;
               for ( var i=0 ; i<errors.length ; i++ )
               {
                  if ( ln==errors[i].getRow() )
                  {
                     // there could be more than one, but only show one for now.
                     msg = errors[i].getMsg();
                     break;
                  }
               }
               if ( msg!=null )
               {
                  $("#error-message")
                     .show()
                     .css( { 'top': $(this).offset().top+$(this).height(),'left':$(this).offset().left+$(this).width() })
                     .html( msg );
               }
            });
            $(".errorline").mouseout( function() {
               $("#error-message")
               .hide();
            });
         }
         else 
         {
            $(result)
               .css({ "margin": 30,"box-shadow": "10px 10px 5px #111111" })
               .appendTo($("#diagram"));
            canvas = result;
         }
      }
   });
   
   editor.setOption("theme", "eclipse");
   hlLine = editor.setLineClass(0, "activeline");

   scroller = editor.getScrollerElement();
   scroller.style.height = "100px";
   scroller.style.width = "100%";
} 

$(document).ready(function()
{
   $("#social").mouseleave( function() {
      $(this).hide();
   });
   $.history.init(getDiagram,{unescape:"/,:_"});
   $(window).resize(resize);
   resize();
});

