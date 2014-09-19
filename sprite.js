var Sprite = function(image, offsetWidth, offsetHeight, width, height, frames) {
	this.image = image;
	this.offsetWidth = offsetWidth;
	this.offsetHeight = offsetHeight;
	this.width = width;
	this.height = height;
	this.frames = frames;
	this.currentFrame = 0;
}

Sprite.prototype.changeFrame = function() {
	this.currentFrame = (this.currentFrame + 1) % this.frames;
}

Sprite.prototype.draw = function(ctx, position, width) {
	ctx.drawImage(
		this.image,
		this.offsetWidth + this.currentFrame * this.width,
		this.offsetHeight,
		this.width,
		this.height,
		position.x - width / 2,
		position.y - this.height * width / this.width,
		width,
		this.height * width / this.width
		)
}