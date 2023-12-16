function simplifyYouTubeLink(originalLink) {
    const videoId = originalLink.match(/(?:\?v=|\/embed\/|\/\d+\/|\/embed\/videoseries\?list=)([^#\&\?]*).*/)[1];
    const simplifiedLink = `https://www.youtube.com/embed/${videoId}`;
    return simplifiedLink;
  }
  
const originalLink = "https://youtu.be/pM6xj7h-DWo?si=NXMKfpqfVbW2Sx9Q";
const simplifiedLink = simplifyYouTubeLink(originalLink);

console.log(simplifiedLink);
  