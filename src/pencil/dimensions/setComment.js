class Comment {
  constructor(
    dimIndex,
    midPoint,
    parent,
    label,
    user,
    commentId,
    updateSpecimenWithTheComment,
    { uuid, mode, comment, intersectionPoint, mesh },
    style = 'default'
  ) {
    const attributes = {
      uuid: dimIndex,
      commentId: commentId,
    };

    this.newCommentDiv = document.createElement('div');
    this.newCommentDiv.classList.add('new-comment');
    this.setAttributes(this.newCommentDiv, attributes);

    const commentBoxDiv = document.createElement('div');
    // commentBoxDiv.classList.add('comment-box');
    this.setAttributes(commentBoxDiv, attributes);

    const abc = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (!e.target.value) return;
      if (e.key === 'Enter')
        updateSpecimenWithTheComment({ user, uuid, mode, comment: e.target.value, intersectionPoint, mesh, commentId });
      // alert('dsdf');
    };

    commentBoxDiv.innerHTML = `<div class="comment-box"><div class="cmt-search"><svg class="cmt-fa-search" width="34" height="37" viewBox="0 0 34 37" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 18.5C20 18.8598 19.8074 19.1888 19.5025 19.3497L3.30252 27.8997C2.99198 28.0636 2.61982 28.0243 2.34616 27.7988C2.0725 27.5732 1.94615 27.2017 2.02147 26.8439L3.77808 18.5L2.02147 10.1561C1.94615 9.79833 2.0725 9.42675 2.34616 9.20121C2.61982 8.97567 2.99198 8.9364 3.30252 9.1003L19.5025 17.6503C19.8074 17.8112 20 18.1402 20 18.5ZM5.42198 19.45L4.18879 25.3077L15.2875 19.45L5.42198 19.45ZM15.2875 17.55L4.18879 11.6923L5.42198 17.55L15.2875 17.55Z" fill="white"/></svg><input id='comment-input-${commentId}' placeholder="Search term"></div></div>`;
    // const profileColDiv = document.createElement('div');
    // profileColDiv.classList.add('profile-col');
    // this.setAttributes(profileColDiv, attributes);

    // const contentColDiv = document.createElement('div');
    // contentColDiv.classList.add('content-col');
    // this.setAttributes(contentColDiv, attributes);

    // const nameRowDiv = document.createElement('div');
    // nameRowDiv.classList.add('name-row');
    // this.setAttributes(nameRowDiv, attributes);

    // const nameDiv = document.createElement('div');
    // nameDiv.classList.add('name');
    // this.setAttributes(nameDiv, attributes);
    // const timeDiv = document.createElement('div');
    // timeDiv.classList.add('time');
    // this.setAttributes(timeDiv, attributes);
    // nameRowDiv.appendChild(nameDiv);
    // nameRowDiv.appendChild(timeDiv);

    // const commentRowDiv = document.createElement('div');
    // commentRowDiv.classList.add('comment-row');
    // this.setAttributes(commentRowDiv, attributes);

    // contentColDiv.appendChild(nameRowDiv);
    // contentColDiv.appendChild(commentRowDiv);

    // commentBoxDiv.appendChild(profileColDiv);
    // commentBoxDiv.appendChild(contentColDiv);

    commentBoxDiv.style.position = 'absolute';
    commentBoxDiv.style.top = '50%';
    commentBoxDiv.style.left = '50%';
    commentBoxDiv.style.zIndex = 998;
    commentBoxDiv.id = `comment-box-${commentId}`;
    // commentBoxDiv.classList.add('comment-box-wrapper');
    this.commentBoxDiv = commentBoxDiv;

    const element = document.getElementById(parent);
    element.appendChild(this.newCommentDiv);

    element.appendChild(this.commentBoxDiv);

    document.getElementById(`comment-input-${commentId}`).addEventListener('keydown', abc);

    this.position = midPoint;
    this.index = dimIndex;
    this.parent = parent;
    // this.setLabels(label, user, commentBoxDiv);
  }

  setAttributes(element, attributes) {
    Object.keys(attributes).forEach((attr) => {
      element.setAttribute(attr, attributes[attr]);
    });
  }

  setPosition(position) {
    this.position = position;
  }

  getInitial = (val) => {
    return val.toString()[0].toUpperCase();
  };

  setLabels(label, user, commentBoxDiv) {
    this.label = label;
    const fullName = user?.fullName ? user.fullName : 'Unknown User';
    const getComBox = commentBoxDiv;
    const getProfileCol = getComBox.children[0];
    const getContentCol = getComBox.children[1];
    const getNameRow = getContentCol.children[0];
    const getNameDiv = getNameRow.children[0];
    const getTimeDiv = getNameRow.children[1];
    const getCommentRow = getContentCol.children[1];
    getProfileCol.innerHTML = this.getInitial(fullName);
    getProfileCol.style.backgroundColor = user?.color ? user.color : '#ff7101';
    getCommentRow.innerHTML = label;
    getNameDiv.innerHTML = fullName;
    getTimeDiv.innerHTML = 'Just now';
  }

  //sets the positions for dimension
  setDimPosition(screenPosition) {
    const translateX = screenPosition.x * window.innerWidth * 0.5;
    const translateY = -screenPosition.y * window.innerHeight * 0.5;
    this.newCommentDiv.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    this.commentBoxDiv.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
  }
}

export default Comment;
