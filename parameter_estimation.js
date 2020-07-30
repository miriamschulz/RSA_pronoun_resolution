// Parameter estimation for an RSA model of cross-linguistic pronoun resolution
// Code adapted from http://www.problang.org/chapters/app-04-BDA.html

///////////////
// RSA MODEL //
///////////////

// reference patterns: subject vs. object co-reference
var interpretationPrior = function() {
  return categorical({ps: [0.80, 0.20], vs: ['subject', 'object']})
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
  finite: function(interpretation) { return interpretation == 'subject' || interpretation == 'object'; },
  alternative: function(interpretation) { return interpretation == 'subject'; }
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
var speaker = cache(function(interpretation, language, connector, alpha) {
  return Infer({method:"enumerate"},
  function(){
    var utterance = utterancePrior(language)
    var cost = constructionCost(utterance, language, connector)
    factor(alpha * (literalListener(utterance).score(interpretation) + cost))
    return utterance
  })
});

// pragmatic listener
var pragmaticListener = cache(function(utterance, alpha) {
  var u = utterance.split("_")
  var utterance = u[0]
  var language = u[1]
  var connector = u[2]
  return Infer({method:"enumerate"},
  function(){
    var interpretation = interpretationPrior()
    observe(speaker(interpretation, language, connector, alpha), utterance)
    return interpretation
  })
});

//////////////////////////
// Parameter Estimation //
//////////////////////////

// Experimental comprehension data
var comp_data = {
  finite_english_before: {subject: 229, object: 57},
  finite_english_after:  {subject: 199, object: 90},
  finite_french_before:  {subject: 251, object: 395},
  finite_french_after:   {subject: 347, object: 296}
}

// Parameter estimation function
var dataAnalysis = function(){

  // prior over alpha
  var alpha = uniform({a:0, b:10})

  map(function(utterance){

    var listener_predictions = pragmaticListener(utterance, alpha)
    var listener_data = comp_data[utterance]

    var int_probs = map(function(s){
      return Math.exp(listener_predictions.score(s))
    }, _.keys(listener_data))

    var int_count = map(function(s){
      return listener_data[s]
    }, _.keys(listener_data))

    observe(Multinomial({n: sum(int_count),
                         ps: int_probs}),
            int_count)

  }, _.keys(comp_data))

  return {alpha: alpha}
}

var parameter_estimation = Infer({
  method: "MCMC",
  samples: 10000,
  burn: 2000,
  model: dataAnalysis})

viz(parameter_estimation)
