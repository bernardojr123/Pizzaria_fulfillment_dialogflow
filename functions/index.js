// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const cardapio = require('./cardapio.json');

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
		console.log("entrou na funcao correta");
	    const contexto_nome = get_slot_atual(agent);
	    let resposta = "";
		if (contexto_nome === "qtd1" || contexto_nome === "qtd2") {
			console.log("ENTROU NO LUGAR CORRETO");
			agent.outgoingContexts_ = [];
			agent.contexts = []
		}else{
			const mensagem_pedidos = set_mensagem_pedidos(agent);
			console.log("mensagem pedidos: ",mensagem_pedidos);
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
		}
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
			let j = i.toString()
			console.log(`j: ${j}`);
			const quantidade = "qtd".concat(j)
			console.log(`qtd: ${quantidade}`);
			const qtd = parametros["qtd" + j]["number"];
			if (qtd === i){
				const msg_qtd = "uma pizza ";
			}else if (qtd === "outras") {
				//// TODO: nao sei o que fazer aqui kkkk
				const msg_qtd = "outras pizza ";
			}else {
				const msg_qtd = qtd.toString() + " pizzas ";
			}
			let mensagem_pedido = "o " + j + "º pedido " + j + ": " + msg_qtd;
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
				mensagem_pedido.concat("e borda de " + borda);
			}
			lista_mensagens.push(mensagem_pedido);
		}
		console.log(lista_mensagens);
		const mensagem_final = "Indentifiquei 2 pedidos: " + lista_mensagens[0] + " e o " + lista_mensagens[1]
		console.log(mensagem_final);
		return (mensagem_final);
	}

	function get_slot_atual(agent){
		try {
			const contexto = agent.contexts.filter( (context) => context.name.includes('_dialog_params_'))[0];
			console.log('contexto get slot atual ' + JSON.stringify(contexto));
			const contexto_nome = contexto.name.split('_').pop();
			return contexto_nome;
		} catch(e) {
			// statements
			console.log('catch erroor ');
			//console.log(e);
			return '';

		}


	}

	function resolve_slot(agent, entidade, msg, primeira_mensagem) {
		// const primeira_mensagem = agent.getContext("primeira_mensagem")
		const contexto = agent.getContext(entidade);
		// console.log("contexto " + JSON.stringify(contexto, null, 4));
		// console.log(agent.contexts[0].parameters);
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

	function calcular_conta (agent) {
		
		const pizzacomprada = agent.contexts.filter( (context) => context.name.includes('pizzacomprada'))[0];
		const itens = pizzacomprada.parameters;
		var valorBorda = 0;

// debugger section
		console.log('cardapio >> '+ JSON.stringify(cardapio.pizzas));
		console.log('itens >> ' + JSON.stringify(itens));

////
		//recuperando os valores 
		const valorPizza = cardapio.pizzas[itens.sabor1].tamanho[itens.tamanho1];
		try {
			valorBorda = cardapio.borda[itens.borda1].tamanho[itens.tamanho1];
		} catch(e) {
			valorBorda = 0;
			console.log('não identificamos nenhuma borda');
			//console.log(e);
		}
		
		console.log('Valor --> ' + valorPizza );
		console.log('Borda --> '+ valorBorda);

		var valorTotal = itens.qtd1["number"]*(valorPizza + valorBorda); 

		agent.add(`Sua pizza ${itens.tamanho1} de ${itens.sabor1} no valor de ${valorTotal} está sendo processada`);
		//agent.add("Se quiser fazer outro pedido fique a vontade ");
		
		
	}

	function mostrar_cardapio (argument) {
		
	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedidos pizza', comprar_dois_pedidos);
	intentMap.set('Finalizar pedido sem refrigerante', calcular_conta);
	agent.handleRequest(intentMap);
});
