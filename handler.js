'use strict';
const querystring = require('querystring');
const base64 = require('base-64');
const fetch = require('node-fetch');

module.exports.sms_receiver = async (event, context, callback) => {
	
  	context.callbackWaitsForEmptyEventLoop = false;

  	const params = querystring.parse(event.body);

  	const data = {
		direction: params['direction'],
		id: params['id'],
		from: decodeURIComponent (params['from']),
		to: decodeURIComponent (params['to']),
		created: decodeURIComponent (params['created']),
		message: decodeURIComponent (params['message'])
	};

	const fmConnection = {
		database: process.env.DATABASE,
		layout: process.env.LAYOUT,
		account: process.env.ACCOUNT,
		password: process.env.PASSWORD
	};

	let aws_result = '';
	if (data.direction == 'incoming') {
		const token = await login(fmConnection);
		const result = await createRecord (fmConnection,data,token);
		const out = await logout (fmConnection,token);
		aws_result = 'OK';
	}
	else {
		aws_result = 'Fel';
	}

  const response = {
		statusCode: 200,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST,HEAD,GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		},
		body: JSON.stringify({
      		result: aws_result,
    	})
	};

  callback(null, response);

};

async function login (fmConnection) {

	let encryptedCredentials = base64.encode(fmConnection.account + ":" + fmConnection.password);
	const url = fmConnection.database + "/sessions";
	const headers =
		{
			'Authorization': 'Basic ' + encryptedCredentials,
			'Content-Type': 'application/json',
		};
	const data = {};
	const payload = JSON.stringify(data);
	const options =
		{
			method: 'POST',
			headers: headers,
			body: payload
		};

	let fmDataToken = '';	
	try {
		const response = await fetch(url,options);
		const json = await response.json();
		fmDataToken = json.response.token;
	} 
	catch (error) {
		console.log(error);
	}
	return fmDataToken;
}

async function createRecord (fmConnection,recordData,fmDataToken) {
	const url = fmConnection.database + "/layouts/" + fmConnection.layout + "/records";
	const headers =
		{
			"Content-Type": "application/json",
			"Authorization": "Bearer " + fmDataToken
		};
	const data = 
		{ 
			"fieldData": recordData
		};
	const payload = JSON.stringify (data);
	const options =
		{
			method: 'POST',
			headers: headers,
			body: payload
		}
	let result = {};
	try {
		const response = await fetch(url,options);
		result = await response.json();
	} 
	catch (error) {
		console.log(error);
	}
	console.log('createrecord param');
	console.log(recordData);
	console.log('createrecord');
	console.log(result);
	return result;
}

async function logout (fmConnection,fmDataToken) {
	const url = fmConnection.database + "/sessions/" + fmDataToken;
	const headers =
		{
			"Content-Type": "application/json"
		};
	const options =
		{
			method: 'DELETE',
			headers: headers
		};
	let result = {};
	try {
		const response = await fetch(url,options);
		result = await response.json();
	} 
	catch (error) {
		console.log(error);
	}
	console.log('logout');
	console.log(result);
	return result;
}