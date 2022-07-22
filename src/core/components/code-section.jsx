import React from "react"
import PropTypes from "prop-types"
import { getSampleSchema } from "core/utils"

export default class CodeSection extends React.Component {
  static propTypes = {
    getComponent: PropTypes.func.isRequired
  }

  constructor(props, context) {
    super(props, context)
    let { clientCode} = this.props
    this.state = {
      activeTab: clientCode[0]
    }
  }

  
  sample = (param) => {
    let { fn:{inferSchema} } = this.props
    let schema = inferSchema(param.toJS())

    return getSampleSchema(schema, "", {
      includeWriteOnly: true
    })
  }


  activeTab = (tab) => {
    this.setState({
      activeTab: tab
    })
  }

  render() {
    let { path,method,getComponent,operation ,specActions,specSelectors,parameters,tag,clientCode,authSelectors} = this.props

    let basePath = specSelectors.basePath()
    let security = operation.get("security") || specSelectors.security();    
    const applicableDefinitions = authSelectors.definitionsForRequirements(security);
    let authentication = applicableDefinitions.valueSeq()?.first()?.valueSeq()?.first() 
                            ? applicableDefinitions.valueSeq().first().valueSeq().first().toJS() : null;
    
    if(authentication){
      if (authentication?.type === 'apiKey') {       
        authentication.codeAuth = "API Key";
        authentication.codeAuth += "\nKey: "+authentication?.name || 'API_KEY';
        authentication.codeAuth += "\nAdd to: "+authentication?.in;
        if (authentication?.in === 'query') {      
          authentication.codeQuery = {key: authentication?.name || 'API_KEY', value: '{YOUR_API_KEY}'};
        } else if (authentication?.in === 'header') {
          authentication.codeHeader = {key: authentication?.name || 'API_KEY', value: '{YOUR_API_KEY}'};
        }else if (authentication?.in === 'cookie') {
          authentication.codeHeader = {key: 'Cookie', value: (authentication?.name || 'API_KEY')+"={YOUR_API_KEY}"};
        }
      } else if (authentication?.type === 'http') {
        if (/^basic$/i.test(authentication?.scheme)) {  
          authentication.codeAuth = "Basic Auth\n#credentials = Encode {YOUR_USERNAME}:{YOUR_PASSWORD} to base64" 
          authentication.basicAuth = true; 
        }else if (/^bearer$/i.test(authentication?.scheme)) { 
          authentication.codeAuth = "Bearer Token";
          authentication.codeHeader = {key: 'Authorization', value: 'Bearer {YOUR_TOKEN}'}; 
        }
      } else if (authentication?.type === 'oauth2' || authentication?.type === 'openIdConnect') {
        authentication.codeAuth = "OAuth 2.0";
        authentication.codeHeader = {key: 'Authorization', value: '{YOUR_HEADER_PREFIX} {YOUR_TOKEN}' }; 
      } 
    }    

    let consumes = operation.get("consumes")
    let produces = operation.get("produces")
    let operationId = operation.get("__originalOperationId")
    let processedParameters = this.getProcessedPerameters(parameters,consumes,produces)

    const HighlightCode = getComponent("highlightCode")

    return <div className="code-section">
      <ul className="tab">
        {
          clientCode.map((lang) => {
            return (true && <li key={lang + "-tab"} className={"tabitem" + (this.state.activeTab === lang ? " active" : "")}>
              <a className="tablinks" onClick={this.activeTab.bind(this, lang)}>{lang}</a>
            </li>)
          })
        }
      </ul>
      
      <div>
        {
           this.state.activeTab.toUpperCase() === "PYTHON" &&
           <div>
           <HighlightCode value={this.getPythonCode(processedParameters,method,path,basePath,authentication)} />
           <b>Prerequisite Library</b> : <a target="_blank" href="http://docs.python-requests.org">requests</a> (pip install requests)
           </div>
        }
      </div>
      
      <div>
        {
           this.state.activeTab.toUpperCase() === "JAVA" &&
           <div>
           <HighlightCode value={this.getJavaCode(processedParameters,method,path,basePath,tag,authentication)} />
           <b>Prerequisite Jars</b> : <a target="_blank" href="http://square.github.io/okhttp/"> OkHttp(3.10.0) </a> , <a target="_blank" href="https://github.com/square/okio"> Okio(1.14.0) </a> 
           </div>
        }
      </div>
      <div>
        {
           this.state.activeTab.toUpperCase() === "HTTP" &&
           <div>
           <HighlightCode value={this.getHttpCode(processedParameters,method,path,basePath,authentication)} />
           </div>
        }
      </div>
       <div>
        {
           this.state.activeTab.toUpperCase() === "JAVA(JAR)" && <div>
<pre className="language-java"><code className="language-java"><span className="token keyword">import</span> com<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>client<span className="token punctuation">.</span>*<span className="token punctuation">;</span>{`
`}<span className="token keyword">import</span> com<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>client<span className="token punctuation">.</span>model<span className="token punctuation">.</span>*<span className="token punctuation">;</span>{`
`}<span className="token keyword">import</span> com<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>demo<span className="token punctuation">.</span>client<span className="token punctuation">.</span>api<span className="token punctuation">.</span>{tag}Api<span className="token punctuation">;</span>{`

`}<span className="token keyword">public</span> <span className="token keyword">class</span> <span className="token class-name">{tag}ApiExample</span> <span className="token punctuation"> {'{'}</span>{`

    `}<span className="token keyword">public</span> <span className="token keyword">static</span> <span className="token keyword">void</span> <span className="token function">main</span><span className="token punctuation">(</span>String<span className="token punctuation">[</span><span className="token punctuation">]</span> args<span className="token punctuation">)</span> <span className="token punctuation"> {'{'}</span>{`
    
        `}ApiClient defaultClient <span className="token operator">=</span> Configuration<span className="token punctuation">.</span><span className="token function">getDefaultApiClient</span><span className="token punctuation">(</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
        `}defaultClient<span className="token punctuation">.</span><span className="token function">setBasePath</span><span className="token punctuation">(</span><span className="token string">"{'{'}YOUR_URL}"</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
        `}defaultClient<span className="token punctuation">.</span><span className="token function">setUsername</span><span className="token punctuation">(</span><span className="token string">"{'{'}YOUR_USERNAME}"</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
        `}defaultClient<span className="token punctuation">.</span><span className="token function">setPassword</span><span className="token punctuation">(</span><span className="token string">"{'{'}YOUR_PASSWORD}"</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`

        `}{tag}Api apiInstance <span className="token operator">=</span> <span className="token keyword">new</span> <span className="token class-name">{tag}Api</span><span className="token punctuation">(</span><span className="token punctuation">)</span><span className="token punctuation">;</span>
        {
          parameters.valueSeq().map((parameter) => {
              var dataType;
              var schema = parameter.get("schema");
              var type = parameter.get("type") 
              if (schema) {
                var splits = parameter.get("schema").get("$$ref").split("/");
                dataType = splits[splits.length - 1]
              } else if (type) { 
                dataType = type;
              }
              if(dataType){
                dataType = dataType.charAt(0).toUpperCase() + dataType.substr(1);
              }
              return (
                <span key={"param"+parameter.get("name")}>{`

        `}<span className="token comment">// {dataType} | {parameter.get("description")}</span>{`
        `}{dataType} {parameter.get("name")} <span className="token operator">=</span> <span className="token punctuation">;</span>
              </span> )        
          }).toArray()

        }
        
        {`

        `}<span className="token keyword">try</span> <span className="token punctuation"> {'{'}</span>{`
            `}Object result <span className="token operator">=</span> apiInstance<span className="token punctuation">.</span><span className="token function">{operationId}</span><span className="token punctuation">(</span>{parameters.valueSeq().map((parameter) => {return(parameter.get("name"))}).toArray().join(", ")}<span className="token punctuation">)</span><span className="token punctuation">;</span>{`
            `}System<span className="token punctuation">.</span>out<span className="token punctuation">.</span><span className="token function">println</span><span className="token punctuation">(</span>result<span className="token punctuation">)</span><span className="token punctuation">;</span>{`
        `}<span className="token punctuation">}</span> <span className="token keyword">catch</span> <span className="token punctuation">(</span><span className="token class-name">ApiException</span> e<span className="token punctuation">)</span> <span className="token punctuation"> {'{'}</span>{`
            `}System<span className="token punctuation">.</span>err<span className="token punctuation">.</span><span className="token function">println</span><span className="token punctuation">(</span><span className="token string">"Exception when calling {tag}Api#{operationId}"</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
            `}System<span className="token punctuation">.</span>err<span className="token punctuation">.</span><span className="token function">println</span><span className="token punctuation">(</span>e<span className="token punctuation">.</span><span className="token function">getResponseBody</span><span className="token punctuation">(</span><span className="token punctuation">)</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
            `}e<span className="token punctuation">.</span><span className="token function">printStackTrace</span><span className="token punctuation">(</span><span className="token punctuation">)</span><span className="token punctuation">;</span>{`
        `}<span className="token punctuation">}</span>{`
        
    `}<span className="token punctuation">}</span>{`
`}<span className="token punctuation">}</span>{`
`}</code></pre>
           <div><b>Download Prerequisites</b> : <a target="_blank" href=".\demo-rest-client.jar"> demo-rest-client.jar  </a> , demo-rest-client-javadoc.jar, demo-rest-client-reference.zip</div>
</div>    
        }
      </div> 
    </div>
  }

  getPythonCode(parameters,method,path,basePath,authentication){
    let code = "import requests"
    if(authentication?.basicAuth){
      code += "\n\nauth=('{YOUR_USERNAME}', '{YOUR_PASSWORD}')"
    }
    if(parameters.body){
      code += "\n\nbody = '''"+ parameters.body +"'''"
    }

    if(parameters.query || authentication?.codeQuery){
      code += "\n\nqueryParams = {"
      if(parameters.query){
        for(var i=0;i<parameters.query.length;i++){
            code+="\n    \""+parameters.query[i].paramName+"\": \"\""
            if(i<parameters.query.length-1 && !authentication?.codeQuery){code+=","}
        }
      }      
      if(authentication?.codeQuery){
        code+="\n    \""+authentication.codeQuery?.key+"\": \""+authentication.codeQuery?.value+"\"";        
      }
      code +="\n}"
    }

    if(parameters.header||authentication?.codeHeader){
      code += "\n\nheaders = {"      
      if(parameters.header){
        for(var i=0;i<parameters.header.length;i++){
            code+="\n    \""+parameters.header[i].paramName+"\": \""+parameters.header[i].paramValue+"\""
            if(i<parameters.header.length-1 && !authentication?.codeHeader){code+=","}
        }
      }
      if(authentication?.codeHeader){
        code+="\n    \""+authentication.codeHeader?.key+"\": \""+authentication.codeHeader?.value+"\"";        
      }
      code +="\n}"
    }
    code +="\n\nresponse = requests."+method+"( url = '"+"{YOUR_URL}"
    if(basePath){
      code +=basePath
    }
    code +=path+"'"    
    if(authentication?.basicAuth){
      code +=",\n            auth = auth"
    }
    if(parameters.query){
      code += ",\n            params = queryParams"
    }
    if(parameters.header){
      code += ",\n            headers = headers"
    }
    if(parameters.body){
      code += ",\n            data = body"
    }
    code +=")"
    code +=`

print response.status_code
print response.headers
print response.content`
    return code
  }

  getJavaCode(parameters,method,path,basePath,tag,authentication){
    let code = `import okhttp3.*;
import java.io.IOException;
    
public class `+tag+`ApiExample {
    
  public static void main(String[] args) {
    
    OkHttpClient client = new OkHttpClient();\n\n    `

        code+=`HttpUrl.Builder urlBuilder = HttpUrl.parse("{YOUR_URL}`
        if(basePath){
          code +=basePath
        }
        code +=path+`").newBuilder();`
        
        
        if(authentication?.codeQuery){
          code+=`\n    urlBuilder.addQueryParameter("`+authentication?.codeQuery?.key+`", "`+authentication?.codeQuery?.value+`");`
        }
        if(parameters.query){
          for(var i=0;i<parameters.query.length;i++){
            code+=`\n    urlBuilder.addQueryParameter("`+parameters.query[i].paramName+`", "");`
          }
        }
        
        code+=`\n    String url = urlBuilder.build().toString(); `
        
        code+=`\n\n    Request request = new Request.Builder()
        .url(url)
        .`+method+`(`;
        if(parameters.body){
          code+=`RequestBody.create(null,`
            var content = parameters.body.split("\n");
            for(var i=0;i<content.length;i++){
              if(i>0){
                code+="        + \""+content[i].replace(/"/g, "'")+"\"\n"
              }
              else {
                code+="\""+content[i].replace("\"","\\\"")+"\"\n"
              }
            }
          code+=`        ))`;
        }else{
          code+=`)`;
        }
        if(authentication?.basicAuth){          
          code+=`\n        .header("Authorization", Credentials.basic("{YOUR_USERNAME}", "{YOUR_PASSWORD}"))`;        
        }
        if(authentication?.codeHeader){
          code+=`\n        .header("`+authentication.codeHeader.key+`", "`+authentication.codeHeader.value+`")`;
        }
        if(parameters.header){
          for(var i=0;i<parameters.header.length;i++){
            code+=`\n        .header("`+parameters.header[i].paramName+`", "`+parameters.header[i].paramValue+`")`
          }
        }
            
      code+=`
        .build();

    try {
        Response response = client.newCall(request).execute();
        System.out.print(response.body().string());
    } catch (IOException e) {
        e.printStackTrace();
    }

  }
}`
    
    return code
  }

  getHttpCode(parameters,method,path,basePath,authentication){
    var code = "URL:\n{YOUR_URL}" 
    if(basePath){
      code +=basePath
    }
    code +=path
    if(authentication?.codeQuery){
      code +="?" +authentication?.codeQuery?.key +"={"+authentication?.codeQuery?.value+"}&" 
    }
    if(parameters.query){
      if(!authentication?.codeQuery){
        code += "?"
      }
      for(var i=0;i<parameters.query.length;i++){
          code+=parameters.query[i].paramName+"={"+parameters.query[i].paramName+"}"
          if(i<parameters.query.length-1){code+="&"}
      }
    }

    code+="\n\nMETHOD:\n"+method.toUpperCase()

    if(authentication){      
      code+=`\n\nAUTHORIZATION:\n`+authentication.codeAuth
    }    

    code+="\n\nHEADERS:"
    if(authentication?.basicAuth){          
      code+=`\nAuthorization = Basic {credentials}`;        
    }
    if(authentication?.codeHeader){
      code+="\n"+authentication.codeHeader.key + " = "+ authentication.codeHeader.value;
    }
    if(parameters.header){
      for(var i=0;i<parameters.header.length;i++){
          code+="\n"+parameters.header[i].paramName+" = "+parameters.header[i].paramValue
      }
    }
    
    if(parameters.body){
      code += "\n\nBODY:\n"+  parameters.body
    }


    return code;
  }


  getProcessedPerameters(parameters,consumes,produces){
    let query = []
    let path = []
    let header = []
    let body;

    parameters.valueSeq().map((parameter) => {      
      let finalObj = {
        paramName: parameter.get("name"),
        unescapedDescription: parameter.get("description"),
        schema : parameter.get("schema"),
        type : parameter.get("type") 
      }

      let inType = parameter.get("in")
      if(inType==="body"){
        body = this.sample(parameter)
      }else if(inType==="query"){
        query.push(finalObj)
      }else if(inType==="header"){
        header.push(finalObj)
      }else if(inType==="path"){
        path.push(finalObj)
      }
    }).toArray()
    
    var contentType ;
    var accept;
    consumes.valueSeq().map((consume) => {   
      if(consume.endsWith("json")){
        contentType = consume;
      }
    }).toArray()
    if(!contentType&&consumes.get(0)){
      contentType = consumes.get(0)
    }
    if( contentType){
      header.push({paramName:"Content-Type",paramValue : contentType})
    }
    produces.valueSeq().map((produce) => {   
      if(produce.endsWith("json")){
        accept = produce;
      }
    }).toArray()
    if(!accept&&produces.get(0)){
      accept = produces.get(0)
    }
    if( accept){
      header.push({paramName:"Accept",paramValue : accept})
    }

    let processed ={}
    if(body){
      processed["body"] = body;
    }
    if(path.length>0){
      processed["path"] = path;
    }
    if(header.length>0){
      processed["header"] = header;
    }
    if(query.length>0){
      processed["query"] = query;
    }
    return processed;
  }

}
