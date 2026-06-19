import Exa from 'exa-js';
import OpenAI from 'openai';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const err = new Error(`${name} is not configured.`);
    err.code = 'missing_api_key';
    throw err;
  }
  return value;
}

export async function lookupProductName(barcode) {
  const trimmed = String(barcode ?? '').trim();
  if (!trimmed) {
    const err = new Error('Barcode is required.');
    err.code = 'invalid_barcode';
    throw err;
  }

  const exa = new Exa(requireEnv('EXA_API_KEY'));
  const exaResult = await exa.search(`EAN ${trimmed}`, {
    numResults: 10,
    type: 'auto',
    contents: {
      highlights: true,
    },
  });

  const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') });
  const completion = await openai.chat.completions.create({
    model: 'gpt-5.5', // Kept your specified model
    messages: [
      { 
        role: 'system', 
        content: 'Extract the Product Name from the provided search results.' 
      },
      { role: 'user', content: JSON.stringify(exaResult) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'product_name_extraction',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            productName: {
              type: ['string', 'null'],
              description: 'The extracted name of the product. Return null if no product name can be confidently identified.'
            }
          },
          required: ['productName'],
          additionalProperties: false
        }
      }
    }
  });

  const parsedResponse = JSON.parse(completion.choices[0].message.content);
  
  return { productName: parsedResponse.productName };
}
