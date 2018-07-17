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
			//let itens = get_lista_pedidos(agent,1);
			//console.log(JSON.stringify(itens));
			//const total = calcular_conta(itens);
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
			const itens = get_lista_pedidos(agent,2);
			console.log("mensagem pedidos: ",itens);
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
			//agent.add(mensagem_pedidos);
			const total = calcular_conta(itens);
		}
		if (resposta !== ""){
			agent.add(resposta);
		}
	}

	// /**
	// * metodo no limbo
	// */
	// function set_mensagem_pedidos(agent, pedidos){
	// 	const parametros = agent.contexts[0].parameters;
	// 	let lista_mensagens = [];
	// 	let itens = [];//[]
	// 	for (let i = 1; i <= pedidos; i++) {
	// 		pedido = {};
	// 		let j = i.toString()
	// 		const qtd = parametros["qtd" + j]["number"];
	// 		if (qtd === 1){
	// 			const msg_qtd = "uma pizza ";
	// 			pedido["qtd"] = qtd;
	//
	// 		}else if (qtd === "outras") {
	// 			const qtd_total = parametros["qtdTotal"]
	// 			pedido["qtd_total"] = qtd_total
	// 		}else {
	// 			const msg_qtd = qtd.toString() + " pizzas ";
	// 			pedido["qtd"] = qtd;
	// 		}
	// 		let mensagem_pedido = "o " + j + "º pedido " +  ": " + msg_qtd;
	// 		const sabor = parametros["sabor" + j];
	// 		const tamanho = parametros["tamanho" + j];
	// 		if (tamanho !== "") {
	// 			mensagem_pedido.concat(tamanho + " ");
	// 			pedido["tamanho"] = tamanho;
	// 		}
	// 		if (sabor !== "") {
	// 			mensagem_pedido.concat("de " + sabor + " ");
	// 			pedido["sabor"] = sabor;
	// 		}
	// 		const massa = parametros["massa" + j];
	// 		if (massa !== "") {
	// 			mensagem_pedido.concat("com massa " + massa + " ");
	// 			pedido["massa"] = massa;
	// 		}
	// 		const borda = parametros["borda" + j];
	// 		if (borda !== "") {
	// 			mensagem_pedido.concat("e borda de " + borda);
	// 			pedido["borda"] = borda;
	// 		}
	// 		lista_mensagens.push(mensagem_pedido);
	// 		itens.push(pedido);
	// 	}
	// 	console.log(lista_mensagens);
	// 	const mensagem_final = "Indentifiquei 2 pedidos: " + lista_mensagens[0] + " e o " + lista_mensagens[1]
	// 	console.log(mensagem_final);
	// 	return (mensagem_final);
	// }

	function get_lista_pedidos(agent, qtd_pedidos){
		const parametros = agent.contexts[0].parameters;
		let itens = [];
		for (let i = 1; i <= qtd_pedidos; i++) {
			let pedido = {};
			let j = i.toString()
			const qtd = parametros["qtd" + j]["number"];
			const sabor = parametros["sabor" + j];
			const tamanho = parametros["tamanho" + j];
			const massa = parametros["massa" + j];
			const borda = parametros["borda" + j];
			if (qtd === 1){
				pedido["qtd"] = qtd;
			}else if (qtd === "outras") {
				const qtd_total = parametros["qtdTotal"];
				pedido["qtd_total"] = qtd_total;
			}else {
				pedido["qtd"] = qtd;
			}
			if (tamanho !== "") {
				pedido["tamanho"] = tamanho;
			}
			if (sabor !== "") {
				pedido["sabor"] = sabor;
			}
			if (massa !== "") {
				pedido["massa"] = massa;
			}
			if (borda !== "") {
				pedido["borda"] = borda;
			}
			itens.push(pedido);
		}
		return itens;
	}

	function get_message(itens){
		let mensagens = [];
		let pizzas_pedidas = 0;
		itens.forEach(function(item, index) {
			let mensagem = "";
			if (item.hasOwnProperty("qtd_total")){
				const quantidade = item.qtd_total - pizzas_pedidas;
			}else {
				const quantidade = item.qtd;
				pizzas_pedidas = pizzas_pedidas + quantidade;
			mensagem = mensagem.concat(` o ${index.toString}º pedido: ${quantidade} pizzas`)
			}if (item.hasOwnProperty("tamanho")){
				const tamanho = item.tamanho;
				mensagem = mensagem.concat(` ${tamanho}`)
			}if (item.hasOwnProperty("sabor")){
				const sabor = item.sabor;
				mensgem = mensagem.concat(` de ${sabor}`)
			}if (item.hasOwnProperty("massa")){
				const massa = item.massa;
				mensagem = mensagem.concat(` com massa ${massa}`)
			}if (item.hasOwnProperty("borda")){
				const borda = item.borda;
				mensagem = mensagem.concat(` e borda ${borda}`)
			}
			mensagens.push(mensagem)
		})
		const mensagem_final = "Indentifiquei 2 pedidos: " + mensagens[0] + " e o " + mensagens[1]
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

	function calcular_conta (itens) {
		let valorTotal = 0;
		let pizzas_total = 0

		itens.forEach( function(pedido) {
				var valorBorda = 0;
				sabor = cardapio.pizzas[pedido.sabor];
				valorPizza = sabor.tamanho[pedido.tamanho];
				try {
					borda = cardapio.borda[pedido.borda];
					valorBorda = borda.tamanho[pedido.tamanho];
				} catch (e) {
					valorBorda = 0;
				}

				if(pedido.hasOwnProperty("qtd_total")){
					element["qtd"] = element["qtd_total"] - pizzas_total;
				}else{
					pizzas_total += element["qtd"];
					valorTotal = valorTotal + element["qtd"]*(valorPizza + valorBorda);
				}

		});

		console.log("Valor Total .. " + valorTotal);

	}

	function mostrar_cardapio (argument) {

	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedidos pizza', comprar_dois_pedidos);
	//intentMap.set('Finalizar pedido sem refrigerante', calcular_conta);
	agent.handleRequest(intentMap);
});
