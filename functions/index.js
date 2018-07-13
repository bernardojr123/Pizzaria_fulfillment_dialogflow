// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  const queryResult = request.body.queryResult;
  const parameter = request.body.queryResult.parameters;
  const actions = request.body.queryResult.action;
  const contexts = request.body.queryResult.output_contexts;
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function comprar_pizza(agent){
    const contexto_nome = get_slot_atual(agent)
    let resposta = ""
    switch (contexto_nome) {
      case "sabor1":
          resposta = resolve_sabor1(agent)
      break;
    }
    if (resposta !== ""){
      agent.add(resposta)
    }
  }

  function resolve_sabor1(agent){
    const contexto = agent.getContext("qtd_sabor1")
    if (contexto === null){
      agent.setContext({ name: 'qtd_sabor1', lifespan: 2, parameters: { qtd: 1 }})
      return "";
    }
    const quantidade  = contexto.parameters.qtd;
    if (quantidade === 1){
      agent.setContext({ name: 'qtd_sabor1', lifespan: 2, parameters: { qtd: (quantidade + 1) }})
      return "Não consegui entender, pode repetir por favor?";
    }else {
      return "Não temos esse sabor"
    }
  }

  function get_slot_atual(agent){
    const contexto = agent.contexts.filter( (context) => context.name.includes('pedir_pizza_dialog_params_'))[0];
    console.log(contexto);
    const contexto_nome = contexto.name.split('_')[4];
    return contexto_nome;
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('pedir pizza', comprar_pizza);
  agent.handleRequest(intentMap);
});
