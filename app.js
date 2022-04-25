const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res)=>{
    res.status(200);
    res.send("Welcome to BunnyBearBao, a market for home-grown food and handcrafts!")
})

app.listen(PORT, (error) =>{
	if(!error)
		console.log("Success! App is running on port " + PORT);
	else
        console.log("Error!! ", error);	
	}
);
