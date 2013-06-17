CodeMirror.defineMode("clike", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings;
//  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  var curPunc;

  function tokenBase(stream, state) {
      
    var ch = stream.next();

    if ( state.startOfLine && state.inString )
    {
       while ( ch!=null && ch!='"') ch=stream.next();
       if ( ch==null ) state.inString=true;
       else state.inString=false;
       return "string";
    }
    if (ch == '"' ) {
       ch = stream.next();
       while ( ch!=null && ch!='"') ch=stream.next();
       if ( ch==null ) state.inString=true;
       else state.inString=false;
       return "string";
     }
    if ( state.startOfLine && state.inParams )
    {
       while ( ch!=null && ch!=')') ch=stream.next();
       if ( ch==null ) state.inParams=true;
       else state.inParams=false;
       return "params";
    }
    if (ch == '(' ) {
       ch = stream.next();
       while ( ch!=null && ch!=')') ch=stream.next();
       if ( ch==null ) state.inParams=true;
       else state.inParams=false;
       return "params";
    }
    if (/[\:\.>]/.test(ch)) {
      curPunc = ch;
      return "operator";
    }

    if (ch == "#") {
        stream.skipToEnd();
        return "comment";
    }

    stream.eatWhile(/[\w\$_]/);
    
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    
    return "word";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true,
        inString: false,
        inParams: false
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

//      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      /*else*/ if (curPunc == "{") pushContext(state, stream.column(), "}");
//      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

(function() {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "actor create destroy loop pause";

  function cppHook(stream, state) {
    if (!state.startOfLine) return false;
    stream.skipToEnd();
    return "meta";
  }

  // C#-style strings where "" escapes a quote.
  function tokenAtString(stream, state) {
    var next;
    while ((next = stream.next()) != null) {
      if (next == '"' && !stream.eat('"')) {
        state.tokenize = null;
        break;
      }
    }
    return "string";
  }

  CodeMirror.defineMIME("text/x-csrc", {
    name: "clike",
    keywords: words(cKeywords),
    //blockKeywords: words("case do else for if switch while struct"),
//    atoms: words("null")
  });

}());
