// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Image} = require('dialogflow-fulfillment');
const cardapio = require('./cardapio.json');
const perguntas_slot = require('./perguntas_slot.json');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	// console.log(agent);
	const queryResult = request.body.queryResult;
	const parameter = request.body.queryResult.parameters;
	const actions = request.body.queryResult.action;
	const contexts = request.body.queryResult.outputContexts;
	// console.log("Contexts : >>>> " + JSON.stringify(contexts));
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
			resposta = montar_msg(itens)
		}
		return resposta;
	}

	function comprar_dois_pedidos(agent){
		const slots_preenchidos = queryResult.allRequiredParamsPresent;
		if (slots_preenchidos) {
			const parametros = {"quantidade_pedidos": 2}
			agent.setContext({ name: "pizzaComprada", lifespan: 2, parameters: parametros});
		}
		const mensagem_p_acesso = get_msg_primeiro_acesso(agent, 2)
		if (mensagem_p_acesso !== "" && !slots_preenchidos){
			agent.add(mensagem_p_acesso)
		}
		const slot_atual = get_slot_atual(agent);
	  const mensagem_slot = montar_mensagem_slot(agent, slot_atual,2);
		if (mensagem_slot !== ""){
			agent.add(mensagem_slot);
		}
	}

	function comprar_refri(agent) {
		const contexto_nome = get_slot_atual(agent);
		let resposta = "";
		switch (contexto_nome) {
			case "refrigerante1":
				resposta = resolve_slot(agent, "refrigerante1", 1);
				break;
			case "tamanhoR1":
				resposta = resolve_slot(agent, "tamanhoR", 1);
				break;
			case "quantidade1":
					resposta = resolve_slot(agent, "quantidade1", 1);
					break;
		}
		console.log("Resposta slot refrigerante: " + resposta);
		if (resposta !== ""){
			agent.add(resposta);
		}
		const required_params = queryResult.allRequiredParamsPresent;
		if (required_params === true) {

			const quantidade_pedidos = contexts[0].parameters.quantidade_pedidos;
			const itens = get_lista_pedidos(agent, quantidade_pedidos);
			console.log(`Comprar refri items: ` + JSON.stringify(itens));
			const valorRefrigerante = calcular_conta(itens);
			const mensagem = montar_msg(itens);
			agent.add(mensagem);
			agent.add(`No valor total de R$ ${valorRefrigerante}.`);
			agent.add("Você está de acordo com o pedido?");
		}


	}

	function get_lista_pedidos(agent, qtd_pedidos){
		const parametros = contexts[0].parameters;
		let itens = [];
		for (let i = 1; i <= qtd_pedidos; i++) {
			let pedido = {};
			let j = i.toString()
			const qtd = parametros["qtd" + j]["number"];
			const sabor = parametros["sabor" + j];
			const tamanho = parametros["tamanho" + j];
			const massa = parametros["massa" + j];
			const borda = parametros["borda" + j];
			const refrigerante = parametros["refrigerante"+j];
			const tamanhoR = parametros["tamanhoR"+j];
			const quantidade = parametros["quantidade"+j];
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
			if (refrigerante !== "") {
				pedido["refrigerante"] = refrigerante;
			}
			if (tamanhoR !== "") {
				pedido["tamanhoR"] = tamanhoR;
			}
			if (quantidade !== "") {
				pedido["quantidade"] = quantidade;
			}
			itens.push(pedido);
		}
		return itens;
	}

	function montar_msg(itens){
		// console.log("array de item: " + JSON.stringify(itens));
		let dict_refri = {};
		let mensagens = [];
		let pizzas_pedidas = 0;
		itens.forEach(function(item, index) {
			let mensagem = "";
			if (item.hasOwnProperty("qtd_total")){
				const quantidade = item.qtd_total - pizzas_pedidas;
				pizzas_pedidas = item.qtd_total;
			}else {
				const quantidade = item.qtd;
				pizzas_pedidas = pizzas_pedidas + quantidade;
			// mensagem = mensagem.concat(` o ${(index+1).toString()}º pedido: ${quantidade} pizza(s)`);
			if (itens.length === 1){
				mensagem = mensagem.concat(` ${quantidade} pizza(s)`);
			}else if (itens.length === 2) {
				mensagem = mensagem.concat(` o ${(index+1).toString()}º pedido: ${quantidade} pizza(s)`);
			}
		}if (item.tamanho != undefined ){
				const tamanho = item.tamanho;
				mensagem = mensagem.concat(` ${tamanho}`);
			}if (item.sabor != undefined ){
				//TODO verificando no caso de um unico sabor, ver quando for dividido fazer um if aqui.
				if(item.sabor.unico != undefined ){
					const sabor = item.sabor.unico;
					mensagem = mensagem.concat(` de ${sabor}`);
				}else{
					const sabor = item.sabor.dividido;
					mensagem = mensagem.concat(` de metade ${sabor.sabor1} e metade ${sabor.sabor2}`);
				}
			}if (item.massa != undefined ){
				const massa = item.massa;
				mensagem = mensagem.concat(` com massa ${massa}`);
			}if (item.borda != undefined ){
				const borda = item.borda;
				mensagem = mensagem.concat(` e borda ${borda}`);
			}if (item.refrigerante != undefined ){
				const refrigerante = item.refrigerante;
				dict_refri["refrigerante"] = refrigerante
			}if (item.tamanhoR != undefined){
				const tamanhoR = item.tamanhoR;
				dict_refri["tamanhoR"] = tamanhoR
			}if (item.quantidade != undefined){
				console.log(JSON.stringify(item));
				console.log(item.hasOwnProperty("quantidade"));
				console.log("quantidade" in item);
				// console.log("quantidade"  item);
				const quantidade = item.quantidade.number;
				dict_refri["quantidade"] = quantidade;
			}
			mensagens.push(mensagem)
		})
		let mensagem_final = "";
		if (itens.length === 1){
			mensagem_final = "Indentifiquei 1 pedido:" + mensagens[0] + ".";
			console.log("menssagem 0 " + JSON.stringify(mensagens[0]));
		}else if (itens.length === 2) {
			mensagem_final = "Indentifiquei 2 pedidos:" + mensagens[0] + " e " + mensagens[1] + ".";
		}
		//console.log("MEnsagem final antes de add refri" + mensagem_final);
		if (Object.keys(dict_refri).length > 0){
			const mensagemRefri = ` Acompanhado de ${dict_refri.quantidade} ${dict_refri.refrigerante} de ${dict_refri.tamanhoR}.`
			mensagem_final = mensagem_final + mensagemRefri;
		}
		return mensagem_final;
	}

	function get_slot_atual(agent){
		try {
			const contexto = agent.contexts.filter( (context) => context.name.includes('_dialog_params_'))[0];
			// console.log('contexto get slot atual ' + JSON.stringify(contexto));
			const contexto_nome = contexto.name.split('_').pop();
			return contexto_nome;
		} catch (e) {
			console.log("get_slot_autal: Não encontrou nenhum slot.");
		}
	}

	function resolve_slot(agent, entidade, quantidade_pedidos) {
		const contexto = agent.getContext(entidade);
		const contador_entidade = entidade.concat("qtd");
		console.log("Contador entidade: " + contador_entidade);
		let parametro = {};
    if (contexto === null){
			parametro[contador_entidade] = 1;
			console.log("Caso primeira fala slot");
			console.log("Parametro primeira fala: " + JSON.stringify(parametro));
			agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
			let dicionario = {};
			if (quantidade_pedidos === 1) {
				dicionario = perguntas_slot["um pedido"];
			}else {
				dicionario = perguntas_slot["multiplos pedidos"];
			}
			const message = dicionario[entidade];
			return message;
    }
    const quantidade  = contexto.parameters[contador_entidade];
		console.log("Quantidade: " + quantidade);
    if (quantidade === 1){
			console.log("Caso segunda fala slot");
			parametro[contador_entidade] = quantidade + 1;
    	agent.setContext({ name: entidade, lifespan: 2, parameters: parametro});
    	return "Não consegui entender, pode repetir por favor?";
    }else {
    	return `Não temos esse ${entidade.slice(0,-1)}`;
    }
	}

	function calcular_conta(itens) {
		let valorTotal = 0;
		let pizzas_total = 0
		itens.forEach( function(pedido) {
				let valorBorda = 0;
				let valorRefrigerante = 0;
				let sabor = "";
				let valorPizza = 0;
				console.log("pedido: " + JSON.stringify(pedido));
				if (pedido.sabor.hasOwnProperty("unico")){
					sabor = cardapio.pizzas[pedido.sabor.unico];
					valorPizza = sabor.tamanho[pedido.tamanho];
				}else {
					let sabor1 = cardapio.pizzas[pedido.sabor.dividido.sabor1];
					console.log("primeiro sabor dividido");
					let valorSabor1 = sabor1.tamanho[pedido.tamanho];
					let sabor2 = cardapio.pizzas[pedido.sabor.dividido.sabor2];
					let valorSabor2 = sabor2.tamanho[pedido.tamanho];
					if (valorSabor1 >= valorSabor2){
						valorPizza = valorSabor1;
					}else {
						valorPizza = valorSabor2;
					}
				}
				console.log(`calcular conta -- sabor: ${sabor}`);
				console.log(`calcular conta -- tamanho: ${pedido.tamanho}`);
				try {
					let borda = cardapio.borda[pedido.borda];
					valorBorda = borda.tamanho[pedido.tamanho];
				} catch (e) {
					valorBorda = 0;
				}
				try {
					const refrigerante = cardapio.refrigerantes[pedido["refrigerante"]];
					valorRefrigerante = refrigerante.tamanhoR[pedido["tamanhoR"]];
					const quantidade = pedido["quantidade"].number;
					valorRefrigerante = valorRefrigerante*quantidade;
				} catch (e) {
					valorRefrigerante = 0;
				}
				if(pedido.hasOwnProperty("qtd_total")){
					pedido["qtd"] = pedido["qtd_total"] - pizzas_total;
				}
				pizzas_total += pedido["qtd"];
				valorTotal = (valorTotal + pedido["qtd"]*(valorPizza + valorBorda))+valorRefrigerante;
		});
		return valorTotal;
	}

	function finalizar_pedido(agent){
		const parametros = contexts[0].parameters;
		const quantidade_pedidos = parametros["quantidade_pedidos"];
		const itens = get_lista_pedidos(agent, quantidade_pedidos);
		const mensagem = montar_msg(itens);
		const valorTotal = calcular_conta(itens);
		// agent.add(`O seu pedido está sendo processado, todo o pedido custou ${valorTotal}`);
		agent.add(mensagem);
		agent.add(`No valor total de R$ ${valorTotal}.`);
		agent.add("Você está de acordo com o pedido?");
	}

	function mostrar_cardapio(agent) {
		console.log("mostrar o cardapio de pizzas");
		agent.add("Na foto abaixo você pode ver os sabores de pizza disponível.")
		agent.add(new Image("http://jonathandesigner.com/projetos/pizzariatorrediitalia/images/bg_pizza.png"));

	}

	// Run the proper function handler based on the matched Dialogflow intent name
	let intentMap = new Map();
	intentMap.set('um pedido pizza', comprar_um_pedido);
	intentMap.set('dois pedidos pizza', comprar_dois_pedidos);
	intentMap.set('Finalizar pedido sem refrigerante', finalizar_pedido);
	intentMap.set('compra refrigerante', comprar_refri);
	intentMap.set('cardapio', mostrar_cardapio);

	agent.handleRequest(intentMap);
});
