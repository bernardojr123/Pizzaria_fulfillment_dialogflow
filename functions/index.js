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
  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function comprar_um_pedido(agent){
    const contexto_nome = get_slot_atual(agent);
    let resposta = "";
    switch (contexto_nome) {
			case "qtd1":
					agent.clearOutgoingContexts();
					break;
			case "sabor1":
          resposta = resolve_slot(agent, "sabor1", "sabor");
					break;
			case "tamanho1":
          resposta = resolve_slot(agent, "tamanho1", "tamanho");
      		break;
    }
    if (resposta !== ""){
      agent.add(resposta)
    }
  }

	function comprar_dois_pedidos(agent){
    const contexto_nome = get_slot_atual(agent);
    let resposta = "";
    switch (contexto_nome) {
			case "qtd1":
			case "qtd2":
					agent.clearOutgoingContexts();
					break
			case "sabor1":
          resposta = resolve_slot(agent, "sabor1", "sabor");
					break;
			case "tamanho1":
          resposta = resolve_slot(agent, "tamanho1", "tamanho");
      		break;
			case "sabor2":
          resposta = resolve_slot(agent, "sabor2", "sabor");
					break;
			case "tamanho2":
          resposta = resolve_slot(agent, "tamanho2", "tamanho");
      		break;
    }
    if (resposta !== ""){
      agent.add(resposta)
    }
  }

	function get_slot_atual(agent){
		const contexto = agent.contexts.filter( (context) => context.name.includes('_dialog_params_'))[0];
		const contexto_nome = contexto.name.split('_').pop();
		return contexto_nome;
	}

	function resolve_slot(agent, entidade, msg, primeira_mensagem) {
		// const primeira_mensagem = agent.getContext("primeira_mensagem")
		const contexto = agent.getContext(entidade)
		// console.log("contexto " + JSON.stringify(contexto, null, 4));
		const contador_entidade = entidade.concat("qtd");
		let parametro = {};
    if (contexto === null){
		parametro[contador_entidade] = 1;
		console.log(parametro);
		agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
		return "";
    }
    const quantidade  = contexto.parameters[contador_entidade];
	console.log("quantidade ", quantidade);
    if (quantidade === 1){
		parametro[contador_entidade] = quantidade + 1;
		console.log(parametro);
      agent.setContext({ name: entidade, lifespan: 2, parameters: parametro})
      return "Não consegui entender, pode repetir por favor?";
    }else {
      return `Não temos esse ${msg}`
    }
	}

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedido pizza', comprar_dois_pedidos);
  agent.handleRequest(intentMap);
});
