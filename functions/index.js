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
	    	agent.add(resposta);
	    }
  }

	function comprar_dois_pedidos(agent){
	    const contexto_nome = get_slot_atual(agent);
	    let resposta = "";
		if (contexto_nome === "qtd1" || contexto_nome === "qtd2") {
			agent.clearOutgoingContexts();
		}
		const mensagem_pedidos = set_mensagem_pedidos(agent);
	    switch (contexto_nome) {
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
		agent.add(mensagem_pedidos);
		if (resposta !== ""){
			agent.add(resposta);
		}
	}

	/**
	* metodo no limbo
	*/
	function set_mensagem_pedidos(agent){
		const parametros = agent.contexts[0].parameters;
		let lista_mensagens = [];
		for (let i = 1; i <= 2; i++) {
			let j = String.format(i)
			const qtd = parametros["qtd" + j]["number"];
			if (qtd === i){
				const msg_qtd = "uma pizza ";
			}else if (qtd === "outras") {
				//// TODO: nao sei o que fazer aqui kkkk
				const msg_qtd = "outras pizza ";
			}else {
				const msg_qtd = String.format(qtd) + " pizzas ";
			}
			let mensagem_pedido = "pedido " + j + ": " + msg_qtd;
			const sabor = parametros["sabor" + j];
			const tamanho = parametros["tamanho" + j];
			if (tamanho !== "") {
				mensagem_pedido.concat(tamanho + " ");
			}
			if (sabor !== "") {
				mensagem_pedido.concat("de " + sabor + " ");
			}
			const massa = parametros["massa" + j];
			if (massa !== "") {
				mensagem_pedido.concat("com massa " + massa + " ");
			}
			const borda = parametros["borda" + j];
			if (borda !== "") {
				mensagem_pedido.concat("com borda de " + borda);
			}
			lista_mensagens.push(mensagem_pedido);
		}
		return (lista_mensagens[0] + " e o " + lista_mensagens[1]);
	}

	function get_slot_atual(agent){
		const contexto = agent.contexts.filter( (context) => context.name.includes('_dialog_params_'))[0];
		const contexto_nome = contexto.name.split('_').pop();
		return contexto_nome;
	}

	function resolve_slot(agent, entidade, msg, primeira_mensagem) {
		// const primeira_mensagem = agent.getContext("primeira_mensagem")
		const contexto = agent.getContext(entidade);
		// console.log("contexto " + JSON.stringify(contexto, null, 4));
		console.log(agent.contexts[0].parameters);
		const contador_entidade = entidade.concat("qtd");
		let parametro = {};
	    if (contexto === null){
			parametro[contador_entidade] = 1;
			console.log(parametro);
			agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
			return "";
	    }
	    const quantidade  = contexto.parameters[contador_entidade];
	    if (quantidade === 1){
			parametro[contador_entidade] = quantidade + 1;
			console.log(parametro);
	    	agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
	    	return "Não consegui entender, pode repetir por favor?";
	    }else {
	    	return `Não temos esse ${msg}`;
	    }
	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedido pizza', comprar_dois_pedidos);
	agent.handleRequest(intentMap);
});
