/*
 * inline js file
 */
function Person() {
}

Person.prototype.sayHello = function () {
  var word = 'hello world!';
  console.log('[inline]:', word);
};

new Person().sayHello();
