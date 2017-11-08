module.exports = function(registry) {
  registry = registry || new Map();

  let undefineds = [];


  let register = function(name, func, overwrite = false) {
    if (name instanceof RegExp) name = name.source;
    if (!registry.has(name) || (registry.has(name) && overwrite)) {
      registry.set(name, func);
    }
  }


  let get_function = function(proc_name) {
    // console.log(`======> PERFORMING LOOKUP ON ${proc_name}`);

    let keys = registry.keys();
    let step = "",
      args = [];
    key = keys.next();
    while (!key.done) {
      if (is_simple(key.value)) {
        step = to_regex(key.value);
        args = simple_params(key.value, proc_name);
      } else {
        step = key.value;
        args = params(step, proc_name);
      }
      let r = new RegExp(step);
      if (r.test(proc_name)) {
        return {
          func: registry.get(step),
          args: args
        };
        break;
      } else {
        key = keys.next();
      }
    }
    console.log(`Unable to locate procedure: "${proc_name}"`);
    undefineds.push(proc_name);
    console.log(`Number of undefined procedures: ${undefineds.length}`);
    // return false;
  };


  let get_value = function(name) {
    return registry.get(name);
  };


  let is_simple = function(text) {
    re = /(?:<)\w+(?:>)/g;
    return re.test(text);
  };


  let to_regex = function(not_regex) {
    return not_regex.replace(/<\w+>/g, "(.*)");
  };


  //TODO: generate two arrays, one of keys and one of values and munge into an object
  //TODO: refactor stuff so that all args are objects
  let simple_params = function(not_regex, haystack) {
    let s = "";
    let keys = [];
    let values = [];
    re = /(?:<)\w+(?:>)/g;
    while (s = re.exec(not_regex)) {
      s = s[0].replace(/[<>]/g, "");
      keys.push(s);
    }
    return [not_regex.replace(/<\w+>/g, "(.*)")].concat(keys);
  };


  let params = function(regex, haystack) {
    let r = new RegExp(regex);
    return r.exec(haystack);
  };


  let dump = function() {
    let keys = registry.keys();
    let key = keys.next();
    console.log(`======= DUMPING REGISTRY =======`);
    console.log(key)
    while (!key.done) {
      // let value = registry.get(key.value);
      // switch (typeof value) {
      //   case "string":
          console.log(key.value, registry.get(key.value));
      //     break;
      //   case "object":
      //     if ()

      // }
      key = keys.next();
    }
  };


  let exists = function(key) {
    if (name instanceof RegExp) key = key.source;
    return registry.has(key);
  };


  let get_undefined = function() {
    return [...new Set(undefineds.splice(0))]; //empty out the undefined list when we return
  }



  return {
    dump: dump,
    exists: exists,
    register: register,
    get_undefined: get_undefined,
    get_value: get_value,
    get_function: get_function,
  };
};