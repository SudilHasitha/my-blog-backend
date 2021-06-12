import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';
// inmemory DB
// const articlesInfo = {
//     'learn-react':{
//         upvotes: 0,
//         comments:[],
//     },
//     'learn-node':{
//         upvotes: 0,
//         comments:[],
//     },
//     'my-thoughts-on-resumes':{
//         upvotes: 0,        
//         comments:[],
//     },
// }

const app = express();
// form static elements to access
app.use(express.static(path.join(__dirname,'/build')))
app.use(bodyParser.json());

// code refactoring DRY
const withDB = async (operations,res) =>{
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017',{useNewUrlParser:true});
        const db = client.db('test');

        await operations(db)

        client.close()

    } catch (error) {
        res.status(500).json({error});
    }
}

app.get('/api/articles/:name',async(req,res) => {
    // try {
    //     const articleName = req.params.name;
    //     const client = await MongoClient.connect('mongodb://localhost:27017',{useNewUrlParser:true});
    //     const db = client.db('test');

    //     const articleInfo = await db.collection('articles').findOne({name:articleName});
    //     res.status(200).json(articleInfo);
    //     client.close()

    // } catch (error) {
    //     res.status(500).json({error});
    // }

    //With DRY
    withDB(async(db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(articleInfo);
    },res)
    
})

// app.get('/hello', (req, res) => res.send("Hello!") );
// app.post('/hello',(req, res) => res.send(`Hello ${req.body.name}!`));
// app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));
app.post('/api/articles/:name/upvote',async(req, res) =>{
    // const articleName = req.params.name;
    // articlesInfo[articleName].upvotes += 1;

    // res.status(200).send(`${articleName} now has ${articleInfo[articleName].upvotes}!`);

    // mongo DB
    // try {
    //     const articleName = req.params.name;
    //     const client = await MongoClient.connect('mongodb://localhost:27017',{useNewUrlParser:true});
    //     const db = client.db('test');

    //     const articleInfo = await db.collection('articles').findOne({name:articleName});
    //     await db.collection('articles').updateOne({name:articleName},{
    //         '$set':{
    //             upvotes: articleInfo.upvotes + 1,
    //         },
    //     });
    //     const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
    //     res.status(200).json(updatedArticleInfo);

    //     client.close()
    // } catch (error) {
    //     res.status(500).json({error});
    // }

    withDB(async(db) => {
        const articleName = req.params.name;
        
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                upvotes: articleInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    },res)
});

// Add comments
app.post('/api/articles/:name/add-comment',async(req, res) => {
    const {username,text} = req.body;
    const articleName = req.params.name;

    // articlesInfo[articleName].comments.push({username,text});
    // res.status(200).send(articlesInfo[articleName]);

    withDB(async(db) => {
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments: articleInfo.comments.concat({username,text}),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);

    },res)
});

app.get("*",(req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

app.listen(8080, () => console.log('Listening on port 8080'));