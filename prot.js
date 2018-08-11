class Component {

	render() {
		console.log(a);
	}

};

class myC extends Component {
	var a = 1;
	constructor(height, width) {
		super();
	    this.height = height;
	    this.width = width;

	    console.log('child is init');
	  }

}

new myC();	