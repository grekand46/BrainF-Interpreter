const $ = (query) => document.querySelector(query);

const pause = (ms) => {
	return new Promise((resolve, reject) => {
  	setTimeout(() => {
    	resolve("dopeops")
    }, ms);
  });
};

const keyMap = {
	'A': 65,
  'B': 66,
};

const ask = (node) => {
	return new Promise((resolve, reject) => {
  	const inputHandler = (event) => {
    	const c = () => {
      	node.value = node.value.slice(0, -1);
      };
    	node.addEventListener("input", c);
    	if(event.key in keyMap){
      	resolve(keyMap[event.key]);
      	node.removeEventListener("keydown", inputHandler);
        node.removeEventListener("input", c)
      }
    };
    node.addEventListener("keydown", inputHandler);
  });
}

let safe = true;
const safeHandler = () => {
  safe = $("#safe").checked;
};
document.querySelector("#safe").addEventListener("change", safeHandler);

const execute = async function(code) {
	const status = {
  	aborted: false,
    ostream: ""
  }; //returned to indicate success or failure
  
  $("#console").value = ""; // clear console

  // static check for mismatched brackets
	const len = code.length;
  const jmpMap = new Array(len);
  const indexStack = [];
  for(let i = 0; i < len; i++) {
  	if(code[i] === '[') {
    	indexStack.push(i);
    } else if(code[i] === ']') {
    	if(indexStack.length === 0) throw new Error("Mismatched brackets");
      const lastIndex = indexStack.pop();
      jmpMap[lastIndex] = i;
      jmpMap[i] = lastIndex;
    }
  }
  if(indexStack.length !== 0) throw new Error("Mismatched brackets");
  
  // setting up data and pointers
  const data = new Array(30000).fill(0);
  let dp = 0; // data pointer
  let ip = 0; // instruction pointer
  
  // run code
  let abort = false;
  const abortHandler = () => {
  	abort = true;
  };
  $("#abort").addEventListener("mouseup", abortHandler);
  while(ip < len) {
  	if(abort) {
    	status.aborted = true;
      return status;
    }
  	switch(code[ip]) {
    	case '+':
      	// Increment current cell
      	if(data[dp] === 255) data[dp] = 0;
        else data[dp]++;
        break;
      case '-':
      	// Decrement current cell
        if(data[dp] === 0) data[dp] = 255;
        else data[dp]--;
        break;
      case '<':
      	// Move data pointer left
        if(dp !== 0) dp--
        break;
      case '>':
      	// Move data pointer right
        if(dp !== 29999) dp++;
        break;
      case ',':
      	// Ask for user input
        $("#console").removeAttribute("readonly");
        $("#console").focus();
        const k = await ask($("#console"));
        console.log(k)
        $("#console").setAttribute("readonly", "");
        break;
      case '.':
      	// Output current cell
        const out = String.fromCharCode(data[dp]);
        if(out === '\b') $("#console").value = $("#console").value.slice(0, -1);
        else $("#console").value += out;
        status.ostream += out;
        break;
      case '[':
      	// Enter loop if current cell isn't zero, jump to end of loop otherwise
        if(data[dp] === 0) {
        	ip = jmpMap[ip];
        }
        break;
      case ']':
      	// Return to start of loop
        ip = jmpMap[ip] - 1;
        break;
      // Other characters will be ignored
    }
    
    if(safe) await pause(0); // await to make loop aync so it's possible to abort
    ip++;
  }
  console.log(data.slice(0, 10));
  $("#abort").removeEventListener("mouseup", abortHandler);
  return status;
};

let program = "";
$("#program").value = program;

$("#run").addEventListener("click", () => {
	program = document.querySelector("#program").value;
  console.log(program)
  execute(program).then((status) => {
    if(status.aborted) console.log("Code was aborted"); 
    else {
    	console.log("Output: " + status.ostream);
    	console.log("Code ran successfully");
    }
  }).catch((error) => {
    console.log("Static check failed: " + error.message);
  });
});
