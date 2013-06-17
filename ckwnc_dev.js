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

var ckwnc = new function()
{

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

   CanvasRenderingContext2D.prototype.dashedLine = function (fromX, fromY, toX, toY, pattern)
   {
      this.beginPath();
      // Our growth rate for our line can be one of the following:
      //   (+,+), (+,-), (-,+), (-,-)
      // Because of this, our algorithm needs to understand if the x-coord and
      // y-coord should be getting smaller or larger and properly cap the values
      // based on (x,y).
      var lt = function (a, b) { return a <= b; };
      var gt = function (a, b) { return a >= b; };
      var capmin = function (a, b) { return Math.min(a, b); };
      var capmax = function (a, b) { return Math.max(a, b); };

      var checkX = { thereYet: gt, cap: capmin };
      var checkY = { thereYet: gt, cap: capmin };

      if (fromY - toY > 0) {
         checkY.thereYet = lt;
         checkY.cap = capmax;
      }
      if (fromX - toX > 0) {
         checkX.thereYet = lt;
         checkX.cap = capmax;
      }

      this.moveTo(fromX, fromY);
      var offsetX = fromX;
      var offsetY = fromY;
      var idx = 0, dash = true;
      while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
         var ang = Math.atan2(toY - fromY, toX - fromX);
         var len = pattern[idx];

         offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
         offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

         if (dash) this.lineTo(offsetX, offsetY);
         else this.moveTo(offsetX, offsetY);

         idx = (idx + 1) % pattern.length;
         dash = !dash;
      }
      this.stroke();
   };

   CanvasRenderingContext2D.prototype.solidRightArrow = function( x, y )
   {
      this.beginPath();
      this.moveTo(x,y);
      this.lineTo(x-7,y-7);
      this.lineTo(x-7,y+7);
      this.closePath();
      this.fill();
   };

   CanvasRenderingContext2D.prototype.solidLeftArrow = function(x,y)
   {
      this.beginPath();
      this.moveTo(x,y);
      this.lineTo(x+7,y-7);
      this.lineTo(x+7,y+7);
      this.closePath();
      this.fill();
   };

   CanvasRenderingContext2D.prototype.rightArrow = function( x, y )
   {
      this.beginPath();
      this.moveTo(x-7,y-7);
      this.lineTo(x,y);
      this.lineTo(x-7,y+7);
      this.stroke();
   };

   CanvasRenderingContext2D.prototype.leftArrow = function(x,y)
   {
      this.beginPath();
      this.moveTo(x+7,y-7);
      this.lineTo(x,y);
      this.lineTo(x+7,y+7);
      this.stroke();
   };

   CanvasRenderingContext2D.prototype.cross = function(x,y)
   {
      this.beginPath();
      this.moveTo(x-10,y-10);
      this.lineTo(x+10,y+10);
      this.stroke();

      this.beginPath();
      this.moveTo(x+10,y-10);
      this.lineTo(x-10,y+10);
      this.stroke();
   };

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

   var FIRST_BOX_LEFT = 20;
   var BOX_TOP = 20;
   var BOX_MIN_WIDTH = 50;
   var BOX_SPACING = 20;
   var BOX_HEIGHT = 30;
   var BOX_TEXT_PADDING = 10;
   var BOX_TEXT_OFFSET = 20;
   var LIFE_WIDTH = 20;
   var FONT = "normal 14px sans-serif";
   var BOX_LINE_COLOR = "black";
   var LIFE_LINE_FONT_COLOR = "black";
   var LINE_SPACING = 30;
   var DASH_STYLE = [8,5];
   var BOX_LINE_SPACE = 10;
   var TEXT_PAD = 5;
   var GRAD_DARK = "#B2B2B2";
   var GRAD_LIGHT = "#D1D1D1";


   var LINE_WIDTH = 1;
   var FONT_HEIGHT = 16;

   var markOut = function( objs, rootSection )
   {
      var yd = rootSection.markOut(0,objs,true);

      while ( yd.deferred.length>0 )
      {
         var d = yd.deferred.shift();
         var result = d.section.markOut(d.y,objs,true);
      }

   };

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

   var Objs = function()
   {
      var objs = new Array();
      var lines = new Array();
      var areas = new Array();

      var invokeId = 0;

      this.count = function()
      {
         return objs.length;
      };

      this.lineCount = function()
      {
         return lines.length;
      };

      this.setCreateAt = function(o,y)
      {
         var obj = objs[o];

         if ( obj.createAt!=0 ) return false;
         for ( var i=0 ; i<obj.invokes.length ; i++ )
         {
            if ( obj.invokes[i].from<=y ) return false;
         }

         for ( var l=0 ; l<lines.length ; l++ )
         {
            var line = lines[l];

            if ( (line.from==o || line.to==o ) && y>=line.y )
            {
               return false;
            }
         }

         obj.createAt = y;
         return true;
      };

      this.add = function( name, cls )
      {
         objs.push( new function()
         {
            this.getName = function() { return name; };
            this.getClass = function() { return cls; };
            this.createAt = 0;
            this.destroyAt = 1000000;
            this.invokes = new Array();

            this.invokesAt = function( pos )
            {
               var result = 0;
               for ( var i=0  ; i<this.invokes.length ; i++ )
               {
                  if ( this.invokes[i].from<=pos && pos<=this.invokes[i].to )
                  {
                     result=this.invokes[i].level;
                  }
               }
               return result;
            };

            this.maxInvokes = function()
            {
               var result = 0;
               for ( var i=0  ; i<this.invokes.length ; i++ )
               {
                  if ( this.invokes[i].to>result )
                  {
                     result = this.invokes[i].to;
                  }
               }
               return result;
            };

            this.invokeBoundaryAt = function( y )
            {
               for ( var i=0 ; i<this.invokes.length ; i++ )
               {
                  if ( this.invokes[i].to==y || this.invokes[i].from==y ) return true;
               }
               return false;
            };

         });
         return objs.length-1;
      };

      this.indexOf = function(str)
      {
         for ( var i=0 ; i<objs.length ; i++ ) 
         {
            if ( objs[i].getName()==str || objs[i].getClass()==str )
            {
               return i;
            }
         }
         return -1;
      };

      this.get = function(i)
      {
         return objs[i];
      };

      this.markInvoke = function( o,from,to )
      {
         var obj = objs[o];
         var level = obj.invokesAt(from) + 1;

         invokeId++;
         obj.invokes.push( { id: invokeId, from: from, to: to, level: level } );
         return invokeId;
      };

      this.incInvoke = function( o,id )
      {
         for ( var i=0 ; i<objs[o].invokes.length ; i++ )
         {
            if ( objs[o].invokes[i].id==id )
            {
               objs[o].invokes[i].to++;
               return;
            }
         }
      };

      this.getInvoke = function( o,id )
      {
         for ( var i=0 ; i<objs[o].invokes.length ; i++ )
         {
            if ( objs[o].invokes[i].id==id )
            {
               return objs[o].invokes[i];
            }
         }
         return null;  
      };

      this.markLine = function( from,to,y,isDashed,text,asynch,fromInvokeId,toInvokeId,invisible )
      {
         var l = { from: from, to: to, y : y, isDashed: isDashed, text:text, asynch: asynch, fromInvokeId: fromInvokeId, toInvokeId:toInvokeId, invisible:invisible };
         lines.push( l );

         return l;
      };

      this.markArea = function ( from,to,left,right, text )
      {
         areas.push( { from:from, to:to, left:left, right: right, text : text } );
      };

      this.lineAt = function( from, to, y )
      {
         var _left = Math.min(from,to);
         var _right = Math.max(from,to);

         for ( var l=0 ; l<lines.length ; l++ )
         {
            var line = lines[l];

            var lleft = Math.min(line.from,line.to);
            var lright = Math.max(line.from,line.to);

            if ( line.y==y )
            {
               if ( _left>lleft && _left>lright ) continue;
               else if ( lleft>_left && lleft>_right ) continue;
               else return true;
            }
         }
         return false;
      };

      this.invokeBoundaryAt = function( objIndexFrom,objIndexTo,y )
      {
         for ( var i=objIndexFrom ; i<=objIndexTo ; i++ )
         {
            if ( objs[i].invokeBoundaryAt(y) ) return true;
         }
         return false;
      };

      this.getWidth = function( context )
      {
         var x = FIRST_BOX_LEFT;

         context.font = FONT;

         for ( var i=0 ; i<objs.length ; i++ )
         {
            var o = objs[i];
            var text = o.getName() + ":" + o.getClass();

            if ( i!=0 )
            {
               x = x + BOX_SPACING;
            }

            x = x + Math.max(context.measureText(text).width + BOX_TEXT_PADDING*2,BOX_MIN_WIDTH);
         }

         x = x + FIRST_BOX_LEFT + 40;

         return x;

      };

      this.getHeight = function()
      {
         var maxLife = 0;

         for ( var i=0 ; i<objs.length ; i++ )
         {
            if ( objs[i].maxInvokes()>maxLife ) maxLife = objs[i].maxInvokes();
         }

         return BOX_TOP*2 + BOX_HEIGHT + (maxLife+1)*LINE_SPACING + BOX_LINE_SPACE;
      };

      this.draw = function( canvas )
      {
         var context = canvas.getContext('2d');

         context.font = FONT;
         context.strokeStyle = "black";
         context.fillStyle = "white";
         context.fillRect(0, 0, canvas.getAttribute('width'), canvas.getAttribute('height'));
         context.fillStyle = "black";
         context.lineWidth = LINE_WIDTH;

//       for ( var l=0 ; l<lines.length ; l++ )
//       {
//       var line = lines[l];
//       var lleft = Math.min(line.from,line.to);
//       var lright = Math.max(line.from,line.to);
//       }

         var maxLife = 0;

         for ( var i=0 ; i<objs.length ; i++ )
         {
            if ( objs[i].maxInvokes()>maxLife ) maxLife = objs[i].maxInvokes();
         }

         for ( var i=0 ; i<objs.length ; i++ )
         {
            var o = objs[i];
            var text = o.getName() + ":" + o.getClass();

            if ( i==0 )
            {
               o.left = FIRST_BOX_LEFT;
            }
            else
            {
               o.left = objs[i-1].left + objs[i-1].width + BOX_SPACING;
            }

            o.width = Math.max(context.measureText(text).width + BOX_TEXT_PADDING*2,BOX_MIN_WIDTH);
            o.top = BOX_TOP;
            o.bottom = BOX_TOP + BOX_HEIGHT;
            o.center = Math.round(o.left + o.width/2);

            context.strokeStyle = BOX_LINE_COLOR;

            var topOffset = 0;

            if ( o.createAt>0 )
            {
               topOffset = BOX_LINE_SPACE + BOX_HEIGHT/2 + o.createAt*LINE_SPACING;
            }

            if ( o.getClass().toLowerCase()=="actor" )
            {
               context.beginPath();
               context.moveTo(o.center,o.top+BOX_HEIGHT/3);
               context.lineTo(o.center,o.bottom-BOX_HEIGHT/3);
               context.lineTo(o.center-BOX_HEIGHT/6,o.bottom);
               context.moveTo(o.center,o.bottom-BOX_HEIGHT/3);
               context.lineTo(o.center+BOX_HEIGHT/6,o.bottom);
               context.moveTo(o.center-BOX_HEIGHT/6,o.top+BOX_HEIGHT/2);
               context.lineTo(o.center+BOX_HEIGHT/6,o.top+BOX_HEIGHT/2);
               context.stroke();
               
               var grd=context.createLinearGradient(o.center-BOX_HEIGHT/6,o.top,o.center+BOX_HEIGHT/6,o.top);
               grd.addColorStop(0,GRAD_DARK);
               grd.addColorStop(1,GRAD_LIGHT);
               context.fillStyle=grd;

               context.beginPath();
               context.arc(o.center,o.top+BOX_HEIGHT/6,BOX_HEIGHT/6,0,Math.PI*2,true);
               context.fill();
               context.beginPath();
               context.arc(o.center,o.top+BOX_HEIGHT/6,BOX_HEIGHT/6,0,Math.PI*2,true);
               context.stroke();
            }
            else
            {
               var grd=context.createLinearGradient(o.left,o.top+topOffset,o.left,o.top+topOffset+BOX_HEIGHT);
               grd.addColorStop(0,GRAD_DARK);
               grd.addColorStop(1,GRAD_LIGHT);
               context.fillStyle=grd;

               context.fillRect(o.left,o.top+topOffset,o.width,BOX_HEIGHT);
               context.strokeRect(o.left,o.top+topOffset,o.width,BOX_HEIGHT);

               context.textAlign = "center";
//             context.fillStyle = "#aaa";
//             context.fillText( text,o.center+1,o.top+BOX_TEXT_OFFSET+topOffset+1);
               context.fillStyle = LIFE_LINE_FONT_COLOR;
               context.fillText( text,o.center,o.top+BOX_TEXT_OFFSET+topOffset);
            }

            if ( o.destroyAt<1000000 )
            {
               context.dashedLine(o.center,o.bottom+topOffset,o.center,(o.destroyAt)*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE, DASH_STYLE );
               context.cross( o.center,(o.destroyAt)*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE);
            }
            else
            {
               context.dashedLine(o.center,o.bottom+topOffset,o.center,(maxLife+1)*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE, DASH_STYLE );
            }

            for ( var j=0 ; j<o.invokes.length ; j++ )
            {
               o.invokes[j].level = o.invokesAt(o.invokes[j].from);
            }

            for ( var level=1 ;  ; level++ )
            {
               var found = false;
               for ( var j=0 ; j<o.invokes.length ; j++ )
               {
                  var v = o.invokes[j];

                  if ( v.level==level )
                  {
                     found = true;
                     var lvl = o.invokesAt(v.from);

                     var invokeOffset = 0;
                     if ( level==1 &&  o.createAt>0 && o.createAt==v.from )
                     {
                        invokeOffset = BOX_HEIGHT/2;
                     }

                     var grd=context.createLinearGradient(o.center - LIFE_WIDTH/2 + (lvl-1)*LIFE_WIDTH/2, 0, o.center + LIFE_WIDTH/2 + (lvl-1)*LIFE_WIDTH/2, 0);
                     grd.addColorStop(0,GRAD_DARK);
                     grd.addColorStop(1,GRAD_LIGHT);
                     context.fillStyle=grd;
                     context.fillRect( o.center - LIFE_WIDTH/2 + (lvl-1)*LIFE_WIDTH/2, v.from*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE+invokeOffset, LIFE_WIDTH, (v.to-v.from)*LINE_SPACING -invokeOffset);
                     context.strokeStyle = "black";
                     context.strokeRect( o.center - LIFE_WIDTH/2 + (lvl-1)*LIFE_WIDTH/2, v.from*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE+invokeOffset, LIFE_WIDTH, (v.to-v.from)*LINE_SPACING - invokeOffset);
                  }
               }
               if ( !found ) break;
            }
         }

         for ( var i=0 ; i<lines.length ; i++ )
         {
            var l = lines[i];
            if ( l.invisible ) continue;
            var from = objs[l.from].center;
            var to = objs[l.to].center;

            var fromInvokes = this.getInvoke(l.from,l.fromInvokeId);
            if ( fromInvokes==null ) fromInvokes = objs[l.from].invokesAt(l.y);
            else fromInvokes = fromInvokes.level;

            var toInvokes = this.getInvoke(l.to,l.toInvokeId);

            if ( toInvokes==null ) toInvokes = objs[l.to].invokesAt(l.y);
            else
            {
               if ( l.to!=l.from && toInvokes.level != objs[l.to].invokesAt(l.y) )
               {
                  log("warning to @ "+l.y);
                  context.strokeStyle = "red";
                  context.strokeRect( objs[l.to].center - LIFE_WIDTH/2 + (toInvokes.level-1)*LIFE_WIDTH/2, toInvokes.from*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE, LIFE_WIDTH, (toInvokes.to-toInvokes.from)*LINE_SPACING );
                  context.strokeStyle = "black";
               }
               toInvokes = toInvokes.level;
            }

            if ( l.from<l.to )
            {
               from = from + LIFE_WIDTH/2*fromInvokes;
               to = to + LIFE_WIDTH/2*toInvokes - LIFE_WIDTH;
               context.textAlign = "left";

               if ( l.text=="create" && l.y==objs[l.to].createAt ) 
               {
                  l.text="<<create>>";
                  to -= objs[l.to].width/2 - LIFE_WIDTH/2;
               }
               else if ( l.text=="destroy" /*&& l.y+2==objs[l.to].destroyAt*/ )
               {
                  l.text="<<destroy>>";
               }
//             context.fillStyle = "#aaa";
//             context.fillText(l.text,from+TEXT_PAD+1,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT -TEXT_PAD+1);
               context.fillStyle = "black";
               context.fillText(l.text,from+TEXT_PAD,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT -TEXT_PAD);

               if ( l.asynch ) context.rightArrow(to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
               else context.solidRightArrow(to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
            }
            else if ( l.from>l.to )
            {
               from = from + LIFE_WIDTH/2*fromInvokes - LIFE_WIDTH;
               to = to + LIFE_WIDTH/2*toInvokes;
               context.fillStyle = "black";
               context.textAlign = "right";

               if ( l.text=="create" && l.y==objs[l.to].createAt )
               {
                  l.text="<<create>>"; 
                  to += objs[l.to].width/2 - LIFE_WIDTH/2;
               }
               else if ( l.text=="destroy" && l.y+2==objs[l.to].destroyAt )
               {
                  l.text="<<destroy>>";
               }
//             context.fillStyle = "#aaa";
//             context.fillText(l.text,from-TEXT_PAD+1,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT -TEXT_PAD+1);
               context.fillStyle = "black";
               context.fillText(l.text,from-TEXT_PAD,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT -TEXT_PAD);

               if ( l.asynch ) context.leftArrow(to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
               else context.solidLeftArrow(to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
            }
            else // from==to
            {
               context.strokeStyle = "black";
               context.fillStyle = "black";
               from = from + LIFE_WIDTH/2*(fromInvokes-1);
               to = from;//to = to + LIFE_WIDTH/2*(toInvokes-1);

               var isCall = objs[l.from].invokesAt(l.y) < objs[l.from].invokesAt(l.y+1);
               if ( isCall )
               {
                  context.textAlign = "left";
                  context.fillText(l.text,from+LIFE_WIDTH/2+TEXT_PAD,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT -TEXT_PAD);

                  if ( ! l.isDashed )
                  { 
                     context.beginPath();
                     context.moveTo(from+(LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.lineTo(from+(3*LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.stroke();
                  }
                  else
                  {
                     context.dashedLine(from+(LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,from+(3*LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
                  }
               }
               else 
               {
                  if ( ! l.isDashed )
                  {  
                     context.beginPath();
                     context.moveTo(from+LIFE_WIDTH,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.lineTo(from+(3*LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.stroke();
                  }
                  else
                  {
                     context.dashedLine(from+LIFE_WIDTH,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,from+(LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
                  }
               }

               if ( ! l.isDashed )
               { 
                  context.beginPath();
                  context.moveTo(from+(3*LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  context.lineTo(from+(3*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  context.stroke();
               }
               else
               {
                  context.dashedLine(from+(2*LIFE_WIDTH/2),l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,from+(2*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
               }

               if ( isCall )
               {
                  if ( ! l.isDashed )
                  { 
                     context.beginPath();
                     context.moveTo(from+(LIFE_WIDTH),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.lineTo(from+(3*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.stroke();
                  }
                  else
                  {
                     context.dashedLine(from,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,from+(3*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
                  }

                  if ( l.asynch ) context.leftArrow(from+LIFE_WIDTH,(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  else context.solidLeftArrow(from+LIFE_WIDTH,(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
               }
               else
               {
                  if ( ! l.isDashed )
                  { 
                     context.beginPath();
                     context.moveTo(from+(LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.lineTo(from+(3*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                     context.stroke();
                  }
                  else
                  {
                     context.dashedLine(from,(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,from+(2*LIFE_WIDTH/2),(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
                  }

                  if ( l.asynch ) context.leftArrow(from,(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  else context.solidLeftArrow(from,(l.y+1)*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
               }
            } // from==to

            if ( from!=to )
            {
               if ( ! l.isDashed )
               {
                  context.beginPath();
                  context.moveTo(from,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  context.lineTo(to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT );
                  context.stroke();
               }
               else
               {
                  context.dashedLine(from,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,to,l.y*LINE_SPACING +BOX_LINE_SPACE+ BOX_TOP+BOX_HEIGHT ,DASH_STYLE );
               }
            }
         }

         for ( var i=0 ; i<areas.length ; i++ )
         {
            var a = areas[i];
            try
            {
               var left = objs[a.left].center-40;
               var top = a.from*LINE_SPACING + BOX_TOP+BOX_HEIGHT + BOX_LINE_SPACE;

               var maxInvokes = 0;
               for ( var xx=a.from ; xx<=a.to ; xx++ )
                  if ( objs[a.right].invokesAt(xx)>maxInvokes ) maxInvokes = objs[a.right].invokesAt(xx);

               maxInvokes++;

               var width = 11*a.text.length;

               var grd=context.createLinearGradient(left,top,left,top+FONT_HEIGHT+8);
               grd.addColorStop(0,GRAD_DARK);
               grd.addColorStop(1,GRAD_LIGHT);
               context.fillStyle=grd;
               context.beginPath();
               context.moveTo(left,top);
               context.lineTo(left,top+FONT_HEIGHT+8 );
               context.lineTo(left + width ,top+ FONT_HEIGHT+8 );
               context.lineTo(left + width+ 10 ,top+FONT_HEIGHT+8 -10 );
               context.lineTo(left + width+ 10 ,top );
               context.fill();

               context.beginPath();
               context.moveTo(left,top+FONT_HEIGHT+8 );
               context.lineTo(left + width ,top+ FONT_HEIGHT+8 );
               context.lineTo(left + width+ 10 ,top+FONT_HEIGHT+8 -10 );
               context.lineTo(left + width+ 10 ,top );
               context.stroke();
               
               context.strokeRect( left, top, objs[a.right].center-left + LIFE_WIDTH*maxInvokes, (a.to-a.from)*LINE_SPACING);

               context.fillStyle = "black";
               context.textAlign = "left";
               context.fillText(a.text, left + 5,top + FONT_HEIGHT);

            }
            catch (e)
            {
               alert(e);
               log("failed to draw area rectangle: a.from="+a.from+",a.to="+a.to);
            }
         }

      };
   };

   var Section = function( _parent, _objIndex )
   {
      var parent = _parent;
      var objIndex = _objIndex;
      var lines = new Array();
      var marked = new Array();

      var section_left = 1000000;
      var section_right = -1;
      var section_top = 1000000;

      this.count = function() { return lines.length; };
      this.get = function(i) { return lines[i]; };
      this.add = function( from,to,name,asynch,sub )
      {
         lines.push( new function()
         {
            this.from = from;
            this.to = to;
            this.name = name;
            this.asynch = asynch;
            this.sub = sub;
         });
      };

      var invokeId;

      this.markInvoke = function( objs, objIndex, y1, y2 )
      {
         return objs.markInvoke(objIndex,y1,y2);
      };

      this.incInvoke = function( objs )
      {
         objs.incInvoke( objIndex,invokeId);
         if ( parent!=null ) parent.incInvoke( objs );
      };

      this.markLine = function( objs, from,to,y,isDashed,text,asynch,fromInvokeId,toInvokeId,invisible )
      {
         var max = Math.max(from,to);
         var min = Math.min(from,to);

         if ( max>section_right ) section_right = max;
         if ( min<section_left ) section_left = min;

         return objs.markLine(from,to,y,isDashed,text,asynch,fromInvokeId,toInvokeId,invisible );
      };

      this.markOut = function( y, objs, isSubSection )
      {
         if ( isSubSection )
         {
            invokeId = this.markInvoke(objs,objIndex,y,y+1);
         }
         y++;

         var deferred = Array();

         var o = null;
         if ( lines.length>0 ) o = lines[0].from;

         for ( var i=0 ; i<lines.length ; i++ )
         {
            var l = lines[i];
            var from = objs.get(l.from);
            var to = objs.get(l.to);

            // test
            while ( true)
            {

               if ( objs.lineAt(l.from,l.to,y) )
               {
                  y++;
                  this.incInvoke(objs);
                  continue;
               }
               if ( objs.get(l.to).createAt > y )
               {
                  y++;
                  this.incInvoke(objs);
                  continue;
               }

               if ( l.from<l.to )
               {
                  if ( objs.invokeBoundaryAt(l.from+1,l.to,y) )
                  {
                     y++;
                     this.incInvoke(objs);
                     continue;
                  }
               }
               if ( l.from>l.to )
               {
                  if ( objs.invokeBoundaryAt(l.to,l.from-1,y) )
                  {
                     y++;
                     this.incInvoke(objs);
                     continue;
                  }
               }

               break;
            } // TEST

            if ( l.sub != null )
            {
               if ( !l.asynch )
               {
                  // SUB-SECTION ------------------------------------------------

                  if ( l.name.substring(0,4)=="loop" && l.from==l.to )
                  {
                     log("loop");
                     log("loop top = "+y);
                     section_top = y;
                     topLine=null;
                  }
                  else if ( l.from!=l.to && l.name=="create" )
                  {
                     var canCreate = objs.setCreateAt(l.to,y);
                     if ( canCreate ) topLine = this.markLine(objs,l.from,l.to,y,true,l.name,/*asynch*/true,invokeId,null,false);
                     else topLine = this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/false,invokeId,null,false);
                  }
                  else if ( l.from!=l.to && l.name=="destroy" )
                  {
                     topLine = this.markLine(objs,l.from,l.to,y,true,l.name,/*asynch*/true,invokeId,null,false);
                  }
                  else
                  {
                     topLine = this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/false,invokeId,null,false);
                  }

                  log("top line not defined? " + topLine);

                  if ( l.from==l.to )
                  {
                     y++;
                     this.incInvoke(objs);
                  }

                  var yd = l.sub.markOut(y,objs,l.name.substring(0,4)!="loop");
                  if ( topLine != null ) topLine.toInvokeId = yd.invokeId;
                  y = yd.y;

                  if ( yd.section_left<section_left ) section_left = yd.section_left;
                  if ( yd.section_right>section_right ) section_right = yd.section_right;

                  while ( yd.deferred.length>0 ) deferred.push( yd.deferred.shift() );

                  // test
                  while ( true)
                  {
                     if ( objs.lineAt(l.from,l.to,y) )
                     {
                        y++;
                        this.incInvoke(objs);
                        if (topLine!=null)              objs.incInvoke( topLine.to, topLine.toInvokeId );
                        continue;
                     }
                     else if ( objs.invokeBoundaryAt(Math.min(l.from,l.to)+1,Math.max(l.to,l.from)-1,y) )
                     {
                        y++;
                        this.incInvoke(objs);
                        if (topLine!=null)              objs.incInvoke( topLine.to, topLine.toInvokeId );
                        continue;
                     }

                     break;
                  }

                  if ( l.from!=l.to && l.name=="destroy" )
                  {
                     var destroyOffset = 1;
                     while ( objs.lineAt(l.to,l.to,y+destroyOffset) ) destroyOffset++;

                     objs.get(l.to).destroyAt = y+destroyOffset;
                     this.markLine(objs,l.to,l.to,y+destroyOffset,true,l.name,/*asynch*/true,invokeId,null,true);
                  }
                  else if ( l.name.substring(0,4)!="loop")
                  {
                     this.markLine(objs,l.to,l.from,y,true,"",/*asynch*/true,yd.invokeId,invokeId,false);
                  }
                  this.incInvoke(objs);

                  if ( l.name.substring(0,4)=="loop")
                  {
                     y++;
                     log("loop bottom = "+y);
                     log("loop: "+l.name);
                     log("bounds: top="+section_top+",left="+section_left+",bottom="+y+",right="+section_right);
                     objs.markArea(section_top,y,section_left,section_right,l.name);

                     this.markLine(objs,section_left,section_right,section_top,true,l.name,/*asynch*/true,invokeId,null,true);
                     this.markLine(objs,section_left,section_right,y,true,l.name,/*asynch*/true,invokeId,null,true);
                     this.incInvoke(objs);
                  } 
                  else if ( l.from==l.to )
                  {
                     y++;
                     this.markLine(objs,l.to,l.from,y,true,"",/*asynch*/false,yd.invokeId,invokeId,true);
                     this.incInvoke(objs);
                  }

                  // END SUB-SECTION ------------------------------------------------


               }
               else
               {

                  // SUB-SECTION ASYNCH ------------------------------------------------

                  while (true)
                  {
                     if ( objs.lineAt(l.from,l.to,y) )
                     {
                        y++;
                        this.incIncoke(objs);
                        continue;
                     }
                     else if ( objs.invokeBoundaryAt(Math.min(l.from,l.to)+1,Math.max(l.from,l.to)-1,y) )
                     {
                        y++;
                        this.incInvoke(objs);
                        continue;
                     }
                     break;
                  }

                  this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/true,invokeId,null,false);
                  if ( l.from==l.to )
                  {
                     y++;
                     this.incInvoke(objs);
                  }
                  deferred.push( { y : y, section: l.sub } );

                  // END SUB-SECTION ASYNCH ------------------------------------------------
               }
            }
            else
            {

               // NO SUB-SECTION ------------------------------------------------

               if ( !l.asynch )
               {
                  // NO SUB-SECTION  -  SYNCH

                  var topLine;

                  if ( l.from!=l.to && l.name=="create" )
                  {
                     var canCreate = objs.setCreateAt(l.to,y);
                     if ( canCreate ) topLine = this.markLine(objs,l.from,l.to,y,true,l.name,/*asynch*/true,invokeId,null,false);
                     else topLine = this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/false,invokeId,null,false);
                  }
                  else if ( l.from!=l.to && l.name=="destroy" )
                  {
                     var destroyOffset = 2;
                     while ( objs.lineAt(l.to,l.to,y+destroyOffset) ) destroyOffset++;

                     objs.get(l.to).destroyAt = y+destroyOffset;
                     topLine = this.markLine(objs,l.from,l.to,y,true,l.name,/*asynch*/true,invokeId,null,false);
                     this.markLine(objs,l.to,l.to,y+destroyOffset,true,l.name,/*asynch*/true,invokeId,null,true);
                  }
                  else if ( l.name=="pause" )
                  {

                     this.incInvoke(objs);
                     y++;
                     continue;
                  }
                  else
                  {
                     topLine = this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/false,invokeId,null,false);

                     if ( l.from==l.to )
                     {
                        y++;
                        this.incInvoke(objs);
                     }
                  }

                  var si = this.markInvoke(objs,l.to,y,y+1);

                  topLine.toInvokeId = si.invokeId;
                  this.incInvoke(objs);
                  y++;

                  // test
                  while ( true)
                  {
                     if ( objs.lineAt(l.from,l.to,y) )
                     {
                        objs.incInvoke( l.to, si );
                        this.incInvoke(objs);
                        y++;
                        continue;
                     }
                     else if ( objs.invokeBoundaryAt(Math.min(l.from,l.to)+1,Math.max(l.from,l.to)-1,y) )
                     {
                        objs.incInvoke( l.to, si );
                        this.incInvoke(objs);
                        y++;
                        continue;
                     }

                     break;
                  }

                  this.markLine(objs,l.to,l.from,y,true,"",true,si.invokeId,invokeId,l.name=="create"||l.name=="destroy");

                  if ( l.from==l.to )
                  {
                     y++;
                     this.incInvoke(objs);
                  }
                  else if ( l.name=="destroy")
                  {
                     this.markLine(objs,l.to,l.to,y+1,true,"",true,si.invokeId,si.invokeId,true);
                  }
                  // END NO SUB-SECTION  -  SYNCH
               }
               else
               {
                  // NO SUB-SECTION  -  ASYNCH

                  var topLine = this.markLine(objs,l.from,l.to,y,false,l.name,/*asynch*/true,invokeId,null,false);
                  if ( l.from==l.to )
                  {
                     y++;
                     this.incInvoke(objs);
                  }
                  var si = this.markInvoke(objs,l.to,y,y+1);

                  this.incInvoke(objs);
                  y++;

                  // END NO SUB-SECTION  -  ASYNCH ////////////////////////////////////
               }
            }

            this.incInvoke(objs);
            y++;
         }

         if ( _parent==null )
         {
            while ( deferred.length>0 )
            {
               var d = deferred.shift();
               var yd = d.section.markOut(d.y,objs,true);

               if ( yd.section_left<this.section_left ) this.section_left = yd.section_left;
               if ( yd.section_right>this.section_right ) this.section_right = yd.section_right;
            }
         }

         return { y : y, invokeId: invokeId, deferred: deferred, section_left: section_left, section_right: section_right };
      };
   };

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

var Error = function( tok, expected,id )
{
   this.getRow = function() 
   {
      return (tok==null?-1:tok.row());
   };
   
   this.getCol = function()
   {
      return (tok==null?-1:tok.col());
   };
   
   this.getMsg = function()
   {
      var msg="";
      for ( var i=0 ; i<=this.getCol() ; i++ ) msg += "&nbsp;";
      msg += "^<br/>";
      return msg + "Expected " + expected + ", found " + (tok==null?"EOF":tok.str()) + " instead.";// {"+id+"}";
   };
   
};
   
   
   var parse = function( parent, objs, curObj, tokens, errors, isRoot )
   {
      var section = new Section( parent,curObj );

      while ( true )
      {
         var tok = tokens.pop();

         if ( tok==null )
         {
            return section;
         }
         else if ( tok.type()==CLASSIFIER )
         {
            if ( tokens.peek()==null )
            {
               errors.push( new Error(null, "class name after ':'",1));
               return section;
            }
            tok = tokens.pop();
            if ( tok.type()!=IDENT )
            {
               errors.push( new Error(tok,"class name after ':'",2));
               continue;
            }

            if ( objs.indexOf(tok.str())==-1 )
            {
               objs.add( "",tok.str() );
            }
         }
         else if ( tok.type()==BRACE_CLOSE )
         {
            if ( isRoot )
            {
               errors.push( new Error(tok,"identifier or ':'",21));
               continue;               
            }
            else
            {
               tokens.unpop();
               return section;
            }
         }
         else if ( tok.type()==IDENT )
         {
            var ident = tok;
            tok = tokens.pop();
            if ( tok==null )
            {
               errors.push( new Error(null, "':','.','>' or '('" ,3));
               return section;
            }
            
            if (  tok.type()==CLASSIFIER )
            {
               var objName = ident.str();

               if ( tokens.peek()==null )
               {
                  errors.push( new Error(null,"class name",4 ));
                  return section;
               }
               tok = tokens.pop();               
               if ( tok.type()!=IDENT )
               {
                  errors.push( new Error(tok,"class name",5));
                  continue;
               }
               var className = tok.str();
               
               if ( objs.indexOf(objName)==-1 )
               {
                  objs.add( objName,className );
               }
            }
            else if ( tok.type()==CALL || tok.type()==SIGNAL )
            {
               var asynch = tok.str()=='>';
               var objName = ident.str();

               tok = tokens.pop(); // method name
               if ( tok==null)
               {
                  errors.push( new Error(null,"method name",6));
                  return section;
               }
               if ( tok.type()!=IDENT )
               {
                  errors.push( new Error(tok,"method name" ,7));
                  continue;
               }
               var methName = tok.str();
               if ( tokens.peek()==null )
               {
                  errors.push( new Error(null, "'('",8 ));
                  return section;
               }
               tok = tokens.pop(); // (
               if ( tok.type()!=BRACKET_OPEN )
               {
                  errors.push( new Error(tok,"'('",9 ));
                  continue;
               }
               
               tok = tokens.pop();  // ) or params 
               if ( tok==null )
               {
                  errors.push( new Error(null, "parameters or ')'" ,10));
                  return section;
               }
               if ( tok.type()==IDENT ) 
               {
                  methName += '('+tok.str()+')';
                  tok = tokens.pop();
                  if ( tok==null )
                  {
                     errors.push( new Error(null, "')'",11 ));
                     return section;
                  }
               }
               if ( tok.type()!=BRACKET_CLOSE )
               {
                  errors.push( new Error(tok, "')'",12));
                  continue;
               }

               var target = objs.indexOf(objName);
               if ( target==-1 )
               {
                 target = objs.add( "",objName );
               }

               if ( tokens.peek()!=null && tokens.peek().type()==BRACE_OPEN )
               {
                  ///////////////////////////////////////////////////////////////////////
                  //
                  // MSG w/BODY
                  //
                  ///////////////////////////////////////////////////////////////////////

                  tokens.pop(); // remove '{'

                  var subSection;
                  if ( asynch ) subSection = parse( null, objs, target, tokens, errors,false );
                  else subSection = parse( section, objs, target, tokens,errors,false );
                  //if ( !(subSection instanceof Section) ) return subSection;

                  tok = tokens.pop();
                  if ( tok==null )
                  {
                     errors.push( new Error(null,"}",13));
                     return section;
                  }
                  if ( tok.type()!=BRACE_CLOSE )
                  {
                     errors.push( new Error(tok,"}",14));
                     continue;
                  }

                  section.add( curObj,target,methName,asynch,subSection );

                  continue;
               }
               else
               {
                  ///////////////////////////////////////////////////////////////////////
                  //
                  // MSG
                  //
                  ///////////////////////////////////////////////////////////////////////

                  section.add( curObj,target,methName,asynch,null );
                  continue;
               }
            }
            else if ( tok.type()==BRACKET_OPEN )
            {
               var methName = ident.str();

               tok = tokens.pop();  // ) or params 
               if ( tok==null )
               {
                  errors.push( new Error(null, "parameters or ')'",15 ));
                  return section;
               }
               if ( tok.type()==IDENT )
               {
                  methName += '('+tok.str()+')';
                  tok = tokens.pop();
                  if ( tok==null )
                  {
                     errors.push( new Error(null, ")",16 ));
                     return section;
                  }
               }
               if ( tok.type()!=BRACKET_CLOSE )
               {
                  errors.push( new Error(tok,')',17 ));
                  continue;
               }

               ///////////////////////////////////////////////////////////////////////
               //
               // MSG TO SELF
               //
               ///////////////////////////////////////////////////////////////////////

               if ( tokens.peek()!=null && tokens.peek().str()=='{' )
               {
                  tokens.pop(); // remove '{'
                  var subSection = parse(section,objs, curObj, tokens, errors,false );
                  //if ( !(subSection instanceof Section) ) return subSection;
                  section.add( curObj,curObj,methName,false,subSection );

                  tok = tokens.pop();
                  
                  if ( tok==null )
                  {
                     errors.push( new Error(tok, '}',18));
                     return section;
                  }
                  if ( tok.type()!=BRACE_CLOSE )
                  {
                     errors.push( new Error(tok, '}',19));
                     continue;
                  }
               }
               else
               {
                  section.add( curObj,curObj,methName,false,null );
               }
            }
            else
            {
               errors.push( new Error(tok,"'.','>',':' or '('" ,20));
               continue;
            }
         } // tok.type()==IDENT
         else
         {
            errors.push( new Error(tok,"identifier, }, or EOF",21 ));
         }
      } // while loop

      return section;
   };

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

   var Tokens = function()
   {
      var tokens = new Array();

      var at = 0;

      this.push = function( tok )
      {
         tokens.push(tok);
      };

      this.pop = function()
      {
         if ( at==tokens.length ) return null;
         return tokens[at++];
      };

      this.unpop = function()
      {
         if ( at>0 ) at--;
      };

      this.peek = function()
      {
         if ( at==tokens.length ) return null;
         return tokens[at];
      };

      this.peekNext = function()
      {
         if ( at+1==tokens.length ) return null;
         else return tokens[at+1];
      };

      this.reset = function()
      {
         at = 0;
      };
      
      this.dump = function()
      {
         log("--- TOKENS.DUMP -------------------");
         for ( var i=0 ; i<tokens.length ; i++ )
         {
            log( tokens[i].toString() );
         }
         log("--- /TOKENS.DUMP ------------------");
      };
   };

   var IDENT = -1;
   var BRACE_OPEN = 1;
   var BRACE_CLOSE = 2;
   var BRACKET_OPEN = 3;
   var BRACKET_CLOSE = 4;
   var CALL = 5;
   var SIGNAL = 6;
   var CLASSIFIER = 7;

   var Token = function( row, col, type, str )
   {
      this.toString = function()
      {
         return (row+1) + "," + col + " : " + (type==IDENT?"ID-":"OP-") + str;
      };
      this.row = function() { return row+1; };
      this.col = function() { return col; };
      this.type = function() { return type; };
      this.ident = function() { return type==IDENT; };
      this.str = function() { return str; };
   };

   var tokenise = function( lines )
   {
      var tokens = new Tokens();
      var token = null;
      var tokenCol = 0;
      var tokenLine = 0;
      var inParams = false;
      var inString = false;
      var openBraceCount = 0;

      for ( var ln=0 ; ln<lines.length ; ln++ )
      {
         for ( var col=0 ; col<lines[ln].length ; col++ )
         {
            var ch = lines[ln].charAt(col);

            if ( inParams && ch!=')' )
            {
               if ( token==null )
               {
                  token = "";
                  tokenLine = ln;
                  tokenCol = col;
               }
               token += ch;
            }
            else if ( inParams && ch==')' )
            {
               if ( token!=null )
               {
                  tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
                  token = null;
               }
               tokens.push( new Token(ln,col,BRACKET_CLOSE,')') );
               inParams = false;   
            }
            else if ( inString && ch!='"' )
            {
               token += ch;
            }
            else if ( inString && ch=='"' )
            {
               tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
               inString = false;
               token=null;
            }
            else if ( ch=='(' )
            {
               if ( token!=null )
               {
                  tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
                  token = null;
               }
               tokens.push( new Token(ln,col,BRACKET_OPEN,'(') );
               inParams = true;
               
            }
            else if ( ch=='"' )
            {
               if ( token!=null )
               {
                  tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
                  token = null;
               }
               inString = true;
               token='';
               tokenLine = ln;
               tokenCol = col;
            }
            else if ( ch==' ' || ch=='\t' )
            {
               if ( token!=null )
               {
                  tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
                  token = null;
               }
            }
            else if ( ch==':' || ch=='{' || ch=='}' || ch=='.' || ch=='>' )
            {
               if ( ch=='{' ) openBraceCount++;
               else if ( ch=='}' ) openBraceCount--;

               if ( token!=null )
               {
                  tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
                  token = null;
               }
               var t;
               if ( ch==":" ) t=CLASSIFIER;
               else if ( ch=="{") t=BRACE_OPEN;
               else if ( ch=="}") t=BRACE_CLOSE;
               else if ( ch==".") t=CALL;
               else t=SIGNAL;
               tokens.push( new Token(ln,col,t,ch));
            }
            else if ( token==null )
            {
               token = ch;
               tokenCol = col;
               tokenLine = ln;
            }
            else
            {
               token += ch;
            }
         } // column loop
         
         if ( inString || inParams ) token += '\n';
         else if ( token!=null )
         {
            tokens.push( new Token(tokenLine,tokenCol,IDENT,token));
            token = null;
         }
      } // lines loop

//      if ( inString ) return "unclosed string";
//      else if ( inParams ) return "unclosed parameters";
//      else if ( openBraceCount>0 ) return "not enough closing braces";
//      else if ( openBraceCount<0 ) return "too many closing braces";
      /*else */return tokens;  
   };

   ///////////////////////////////////////////////////////////////////////////////
   //
   //
   //
   ///////////////////////////////////////////////////////////////////////////////

   var log = function( str )
   {
      //console.log(str);
   };

   ///////////////////////////////////////////////////////////////////////////////
   //
   //
   //
   ///////////////////////////////////////////////////////////////////////////////

   this.generate = function( src )
   {
      var lines = src.split("\n");
      var comments = [];
      var inString = false;

      for ( var ln=0; ln<lines.length ; ln++ )
      {
         for ( var ch=0 ; ch<lines[ln].length ; ch++ )
         {
            if ( lines[ln].charAt(ch)=='"' )
            {
               if ( inString==false ) inString='"';
               else if ( inString=='"' ) inString=false;
            }
            else if ( lines[ln].charAt(ch)=='#' && inString==false )
            {
               comments.push( lines[ln].substring(ch) );
               lines[ln] = lines[ln].substring(0,ch);
               break;
            }
         }
      }

      var tokens = tokenise(lines);
      if ( ! ( tokens instanceof Tokens ) )
      {
         log("ERROR: " + tokens );
         return;
      }

      tokens.dump();
      
      
      var errors = [];
      var objs = new Objs();
      var section = parse(null,objs,0,tokens,errors,true);
      if ( errors.length>0 ) return errors;

      // for the special case when there are no objects defined.
      if ( objs.count()==0 )
      {
         objs.add("","actor");
      }

      var r = markOut(objs,section,true);
      var canvas = document.createElement("canvas");
      if ( !canvas.getContext ) return null;
      var context = canvas.getContext('2d');
      if ( !context ) return null;

      canvas.height = objs.getHeight();
      canvas.width = objs.getWidth( context );

      if (window.devicePixelRatio)
      {
         var canvasWidth = canvas.width;
         var canvasHeight = canvas.height;

         canvas.width = canvasWidth * window.devicePixelRatio;
         canvas.height = canvasHeight * window.devicePixelRatio;
         canvas.style.width = canvasWidth;
         canvas.style.height = canvasHeight;
         context.scale(window.devicePixelRatio, window.devicePixelRatio);               
      }

      context.translate(0.5, 0.5);
      objs.draw( canvas );

      return canvas;
   };

};
/////////////////// END NAMESPACE ///////////////////////////////////////////
