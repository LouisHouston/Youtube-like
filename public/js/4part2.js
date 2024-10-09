let counter = 0;
const picCounter = document.getElementById("photo-counter");
const imageContainer = document.getElementById('image-container');

fetch('https://jsonplaceholder.typicode.com/albums/2/photos')
    .then(response => response.json())
    .then(data => {
        const imageArray = data;

        let row = null;
        for (let i = 0; i < imageArray.length; i++) {
            const title = imageArray[i].title;
            const url = imageArray[i].url;

            const imgElement = document.createElement('img');
            const titleElement = document.createElement('div');
            titleElement.textContent = title;
            imgElement.src = url;
            imgElement.alt = title;
            imgElement.setAttribute("onclick","imageClick(this)" )

            if (counter % 2 === 0) {
                row = document.createElement('div');
                row.classList.add('row');
                imageContainer.appendChild(row);
            }

            const column = document.createElement('div');
            column.classList.add('column');
            column.appendChild(titleElement);
            column.appendChild(imgElement);
            row.appendChild(column);

            counter++;
            picCounter.textContent = counter;
        }
    });

function imageClick(img) {
    var opacity = 1;
	var timer = setInterval(function(){
		if(opacity < 0.1){
			clearInterval(timer);
		}
		img.style.opacity = opacity;
		opacity -=  0.1;
	}, 100);
    var removeTimer = setInterval(function(){
        img.remove()
    }, 500);
    counter--;
    picCounter.textContent = counter;
}