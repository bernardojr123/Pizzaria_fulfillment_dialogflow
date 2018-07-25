// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const cardapio = require('./cardapio.json');
const perguntas_slot = require('./perguntas_slot.json');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	// console.log(agent);
	const queryResult = request.body.queryResult;
	const parameter = request.body.queryResult.parameters;
	const actions = request.body.queryResult.action;
	const contexts = request.body.queryResult.output_contexts;
	// console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	// console.log('Dialogflow Request body: ' + JSON.stringify(request.body));


	/**
	*	Função chamada quando o dialogflow recebe a intenção "um pedido pizza", para construir toda a logica para criar um pedido e responder para o usuário.
	* @param {object} agent objeto agent enviado pelo dialogflow com todos as informações do dialogo
	**/
	function comprar_um_pedido(agent){
		const slot_atual = get_slot_atual(agent);
		const mensagem_slot = montar_mensagem_slot(agent, slot_atual,1);
		const slots_preenchidos = queryResult.allRequiredParamsPresent;
		if (slots_preenchidos) {
			const parametros = {"quantidade_pedidos": 1}
			console.log("comprando uma pizza");
			agent.setContext({ name: "pizzaComprada", lifespan: 2, parameters: parametros});
		}
		if (mensagem_slot !== ""){
			agent.add(mensagem_slot);
		}
	}

	/**
	*	Recebe o slot atual e monta a mensagem dependendo da quantidade de vezes
	* em que o slot foi chamado.
	* @param {string} slot_atual nome do slot a ser tratado
	* @param {string} quantidade_pedidos nome do slot a ser tratado
  * @return {string} resposta resposta a ser enviada para o dialogflow
	**/
	function montar_mensagem_slot(agent, slot_atual, quantidade_pedidos){
		console.log("quantidade de pedidos: "+quantidade_pedidos);
		let resposta = ""
		switch (slot_atual) {
			case "sabor1":
		  	resposta = resolve_slot(agent, "sabor1", quantidade_pedidos);
				break;
			case "tamanho1":
		  	resposta = resolve_slot(agent, "tamanho1", quantidade_pedidos);
		    break;
			case "sabor2":
	      resposta = resolve_slot(agent, "sabor2", quantidade_pedidos);
				break;
			case "tamanho2":
				resposta = resolve_slot(agent, "tamanho2", quantidade_pedidos);
      	break;
		}
		return resposta;
	}


	function get_msg_primeiro_acesso(agent, quantidade_pedidos) {
		const primeiro_acesso = agent.getContext("primeiro_acesso_intencao");
		let resposta = "";

		if (primeiro_acesso === null) {
			agent.setContext({ name: "primeiro_acesso_intencao", lifespan: 2});
			const itens = get_lista_pedidos(agent, quantidade_pedidos);
			resposta = montar_msg_primeiro_acesso(itens)
		}
		return resposta;
	}

	function comprar_dois_pedidos(agent){
		const mensagem_p_acesso = get_msg_primeiro_acesso(agent, 2)
		if (mensagem_p_acesso !== ""){
			agent.add(mensagem_p_acesso)
		}
		const slot_atual = get_slot_atual(agent);
	  const mensagem_slot = montar_mensagem_slot(agent, slot_atual,2);
		const slots_preenchidos = queryResult.allRequiredParamsPresent;
		if (slots_preenchidos) {
			const parametros = {"quantidade_pedidos": 2}
			agent.setContext({ name: "pizzaComprada", lifespan: 2, parameters: parametros});
		}
		if (mensagem_slot !== ""){
			agent.add(mensagem_slot);
		}
	}

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

	function montar_msg_primeiro_acesso(itens){
		let mensagens = [];
		let pizzas_pedidas = 0;
		itens.forEach(function(item, index) {
			let mensagem = "";
			if (item.hasOwnProperty("qtd_total")){
				const quantidade = item.qtd_total - pizzas_pedidas;
			}else {
				const quantidade = item.qtd;
				pizzas_pedidas = pizzas_pedidas + quantidade;
			mensagem = mensagem.concat(` o ${(index+1).toString()}º pedido: ${quantidade} pizza(s)`)
			}if (item.hasOwnProperty("tamanho")){
				const tamanho = item.tamanho;
				mensagem = mensagem.concat(` ${tamanho}`)
			}if (item.hasOwnProperty("sabor")){
				const sabor = item.sabor;
				mensagem = mensagem.concat(` de ${sabor}`)
			}if (item.hasOwnProperty("massa")){
				const massa = item.massa;
				mensagem = mensagem.concat(` com massa ${massa}`)
			}if (item.hasOwnProperty("borda")){
				const borda = item.borda;
				mensagem = mensagem.concat(` e borda ${borda}`)
			}
			mensagens.push(mensagem)
		})
		const mensagem_final = "Indentifiquei 2 pedidos: " + mensagens[0] + " e o " + mensagens[1] + "."
		return mensagem_final;
	}

	function get_slot_atual(agent){
		try {
			const contexto = agent.contexts.filter( (context) => context.name.includes('_dialog_params_'))[0];
			// console.log('contexto get slot atual ' + JSON.stringify(contexto));
			const contexto_nome = contexto.name.split('_').pop();
			return contexto_nome;
		} catch (e) {
			console.log("contexto de slot ainda inexistente");
		}
	}


	function resolve_slot(agent, entidade, quantidade_pedidos) {
		const contexto = agent.getContext(entidade);
		const contador_entidade = entidade.concat("qtd");
		let parametro = {};
    if (contexto === null){
			parametro[contador_entidade] = 1;
			agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
			let dicionario = {};
			if (quantidade_pedidos === 1) {
				dicionario = perguntas_slot["um pedido"];
				console.log("dicionario" + dicionario);
			}else {
				dicionario = perguntas_slot["multiplos pedidos"];
				console.log("dicionario" + dicionario);
			}
			const message = dicionario[entidade];
			return message;
    }
    const quantidade  = contexto.parameters[contador_entidade];
    if (quantidade === 1){
			parametro[contador_entidade] = quantidade + 1;
    	agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
    	return "Não consegui entender, pode repetir por favor?";
    }else {
    	return `Não temos esse ${entidade.slice(0,-1)}`;
    }
	}

	function calcular_conta (itens) {
		let valorTotal = 0;
		let pizzas_total = 0
		itens.forEach( function(pedido) {
				let valorBorda = 0;
				// console.log(`pedido: ${JSON.stringify(pedido)}`);
				let sabor = cardapio.pizzas[pedido["sabor"]];
				let valorPizza = sabor.tamanho[pedido.tamanho];
				try {
					let borda = cardapio.borda[pedido.borda];
					valorBorda = borda.tamanho[pedido.tamanho];
				} catch (e) {
					valorBorda = 0;
				}

				if(pedido.hasOwnProperty("qtd_total")){
					pedido["qtd"] = pedido["qtd_total"] - pizzas_total;
				}else{
					pizzas_total += pedido["qtd"];
					valorTotal = valorTotal + pedido["qtd"]*(valorPizza + valorBorda);
				}
				console.log("qtd: "+ pedido["qtd"]);
				console.log("borda "+valorBorda);
				console.log("Pizza "+valorPizza);

		});

		console.log("Valor Total .. " + valorTotal);
		return valorTotal;
	}

	function finalizar_pedido(agent){
		const parametros = agent.contexts[0].parameters;
		const quantidade_pedidos = parametros["quantidade_pedidos"]
		const itens = get_lista_pedidos(agent, quantidade_pedidos);
		console.log(itens);
		const valorTotal = calcular_conta(itens);
		agent.add(`O seu pedido está sendo processado, todo o pedido custou ${valorTotal}`);

	}

	function mostrar_cardapio (argument) {

	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedidos pizza', comprar_dois_pedidos);
	intentMap.set('Finalizar pedido sem refrigerante', finalizar_pedido);
	
	agent.handleRequest(intentMap);
});
