var Point = function(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.mult = function(number) {
	return new Point(this.x * number, this.y * number);
}

Point.prototype.add = function(point) {
	return new Point(this.x + point.x, this.y + point.y);
}

Point.prototype.distanceTo = function(point) {
	return Math.sqrt((this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y));
}

Point.prototype.equals = function(point) {
	return (this.x === point.x && this.y === point.y);
}


var Projection = function() {}

Projection.prototype.toIsometric = function(point) {
	return new Point(point.x - point.y, (point.x + point.y) / 2);
}

Projection.prototype.toCartesian = function(point) {
	return new Point((2 * point.y + point.x) / 2, (2 * point.y - point.x) / 2);
}

