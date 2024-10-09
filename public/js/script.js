$(document).ready(function() {
    $('#login-form').submit(function(event) {
      event.preventDefault(); // Prevent default form submission
      var formData = $(this).serialize(); // Serialize form data
      $.ajax({
        url: '/login', // Your login route
        type: 'POST',
        data: formData, // Send serialized form data as request body
        success: function(response) {
          // Handle successful login response
          alert("Login Successful!");
          window.location.href = '/'; // Redirect to dashboard on successful login
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // Handle login error
          alert('Login failed!');
        }
      });
    });
  });

  function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
      fetch('/Profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({postId: postId})
      })
      .then(response => {
        if (response.ok) {
          // reload the page to show the updated post list
          window.location.reload();
        } else {
          alert('Failed to delete post');
        }
      })
      .catch(error => {
        alert('Error deleting post: ' + error.message);
      });
    }
  }
