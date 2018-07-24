const express=require('express');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'carrasco',
    database : 'smart_brain'
  }
});

const app=express();
app.use(bodyParser.json());
app.use(cors());
app.get('/',(req,res)=>{
	res.send("it's working");
});
app.post('/signin',(req,res)=>{
	const{email,password}=req.body;
	knex.select('*').from('login').where('email','=',email).then(response=>{
		const compare=bcrypt.compareSync(password, response[0].hash);
		if(compare)
		{
			return knex.select('*').from('users').where('email','=',email).then(data=>{
				res.json(data[0])
			}).catch(err=>{res.json('error')})
		}
		else{
			res.status(400).json('unable to connect')
		}
	}).catch(err=>{
		res.status(400).json('unable to connect');
	})
})
app.post('/register',(req,res)=>{
	const{email,name,password}=req.body;
	if(email&&name&&password)
	{
		const hash=bcrypt.hashSync(password);
		knex.transaction(trx=>{
			trx.insert({
				email:email,
				hash:hash
			}).into('login').returning('email').then(loginEmail=>{
				return trx('users').returning('*').insert({
						name:name,
						email:loginEmail[0],
						joined:new Date()
					}).then(user=>{
						res.json(user[0]);
					})
			}).then(trx.commit).catch(trx.rollback)
		}).catch(err=>{
						res.status(400).json('unable to connect');
	})
}
})
app.get('/profile/:id',(req,res)=>{
	const{id}=req.params;
	knex('users').where('id', id).then(response=>{
		if(response.length){
			res.json(response[0]);
		}
		else
		{
			res.json('not connecting');
		}
	}).catch(err=>{
		res.status(400).json('error');
	})
})
app.put('/image',(req,res)=>{
	const{id}=req.body;
	knex('users').where('id', '=', id).increment('entries', 1).returning('entries').then(response=>{
		if(response.length){
		res.json(response[0])
	}
	else{
		res.json('the id does not match');
	}
	})
	.catch(err=>{
		res.status(400).json('error in updating entries');
	})
})
let port=Number(process.env.PORT || 3000);
app.listen(port);