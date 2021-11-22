const a = {};
const testES6 = (...args) => console.log(args, a?.b?.c);

class Animal {
  constructor() {
    console.log('father');
  }
}

class Bird extends Animal {
  constructor() {
    super();
  }
}
