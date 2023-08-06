const Airtable = require('airtable');
const express = require("express");
const cors = require("cors");
const moment = require("moment");
require('dotenv').config();

const token = process.env.TOKEN;
const base = new Airtable({apiKey: token}).base(process.env.BASE);

const app = express();
app.use(cors())


//query Components table 
const getComponent = async (id) => {
    const component = await base('Components').find(id)
    const {fields} = component;

    const componentInfo = {name: fields.Name, madeIn: fields['Made in'], process: fields['Manufacturing process'] };
    return componentInfo;
}

app.get('/product/:id', (req, res) => {
    const id = req.params.id;

base('Products').select({
    fields: ["Type", "Name", 'Assembled at', 'Assembled by', 'Assembly date', 'Components'],
    filterByFormula: `({ID} = '${id}')`
}).firstPage(async (err, record) => {
    if (err) { console.error(err); return; }
   
    const data = record[0];

    if (!data) { console.error(err); return; }
    
    const {fields} = data;
    const components = fields.Components;

    //components details are in another table
    //so we need to query this table with each componentId
    const getComponentsDetails = async() => {
       return Promise.all(components.map(async (componentId) => await getComponent(componentId)));
    }

    const componentsDetails =  await getComponentsDetails();

        const type = fields.Type;
        const name = fields.Name;
        const assembledAt = fields['Assembled at'];
        const assembledBy = fields['Assembled by'];
        const assembledDate = fields['Assembly date'];

        //format the date 
        const formattedDate = moment(new Date(assembledDate)).format("MM/DD/YYYY");

        return res.json({type, name, assembledAt, assembledBy, assembledDate: formattedDate, componentsDetails})
});

})

console.log('process.env.PORT', process.env.PORT)

app.listen(process.env.PORT || 5000);
