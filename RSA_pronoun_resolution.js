// A Rational Speech Act model of cross-linguistic pronoun resolution

////////////////////////////////////////////
// PRIORS, COSTS, ALPHA, MEANING FUNCTION //
////////////////////////////////////////////

// reference patterns: subject vs. object co-reference
var interpretationPrior = function() {
  return categorical({ps: [0.80, 0.20], vs: ['1-subject', '2-object']})
};

// possible utterances
var utterancePrior = function(language) {
  if (language == 'english' || language == 'french') {
    return uniformDraw(['finite', 'alternative']);
  }
  else {
    return ('finite');
  }
};

// meaning function
var literalMeanings = {
  finite: function(interpretation) { return interpretation == '1-subject' || interpretation == '2-object'; },
  alternative: function(interpretation) { return interpretation == '1-subject'; }
};

// cost function
var constructionCost = function(utterance, language, connector) {
  // English
  if (language == 'english') {
    if (connector == 'before') {
      return (utterance === 'finite' ? -0.117 : -2.207);
    } else {
      return (utterance === 'finite' ? -0.511 : -0.916);
    }
  }
  // French
  else if (language == 'french') {
    if (connector == 'before') {
      return (utterance === 'finite' ? -1.309 : -0.315);
    } else {
      return (utterance === 'finite' ? -1.470 : -0.261);
    }
  }
  // German
  else {
    return (0);
  }
};

// speaker optimality
var alpha = 0.93


////////////////////////////////
// THE INTERPRETATION PROCESS //
////////////////////////////////

// literal listener
var literalListener = cache(function(utterance, language, connector) {
  return Infer({method:"enumerate"},
  function(){
    var interpretation = interpretationPrior()
    var meaning = literalMeanings[utterance]
    condition(meaning(interpretation))
    return interpretation
  })
});

// pragmatic speaker
var speaker = cache(function(interpretation, language, connector) {
  return Infer({method:"enumerate"},
  function(){
    var utterance = utterancePrior(language)
    var cost = constructionCost(utterance, language, connector)
    factor(alpha * (literalListener(utterance).score(interpretation) + cost))
    return utterance
  })
});

// pragmatic listener
var pragmaticListener = cache(function(utterance, language, connector) {
  return Infer({method:"enumerate"},
  function(){
    var interpretation = interpretationPrior()
    observe(speaker(interpretation, language, connector), utterance)
    return interpretation
  })
});


/////////////////////
// DISPLAY RESULTS //
/////////////////////

print("English 'before':")
viz.table(pragmaticListener('finite', 'english', 'before'));
viz.auto(pragmaticListener('finite', 'english', 'before'));

print("English 'after':")
viz.table(pragmaticListener('finite', 'english', 'after'));
viz.auto(pragmaticListener('finite', 'english', 'after'));

print("French 'avant':")
viz.table(pragmaticListener('finite', 'french', 'before'));
viz.auto(pragmaticListener('finite', 'french', 'before'));

print("French 'apres':")
viz.table(pragmaticListener('finite', 'french', 'after'));
viz.auto(pragmaticListener('finite', 'french', 'after'));

print("German 'before':")
viz.table(pragmaticListener('finite', 'german', 'before'));
viz.auto(pragmaticListener('finite', 'german', 'before'));

print("German 'after':")
viz.table(pragmaticListener('finite', 'german', 'after'));
viz.auto(pragmaticListener('finite', 'german', 'after'));
