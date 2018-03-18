(function(){
    window.onload = function() {
        
        function submit() {
            var email = document.getElementById("email").value;
            var pass = document.getElementById("password").value;
            clear();
            api.signin(email, pass, function(err, res) {
                if (err) console.log(err);
                window.location.href = "/";
            });
        }
        
        function clear() {
            document.getElementById("email").value = '';
            document.getElementById("password").value = '';   
        }
                       
        document.getElementById("submit-btn").addEventListener("click", function() {
             submit();
        });
        
        document.querySelector('form').addEventListener('submit', function(e){
            e.preventDefault();
        });
    };
}());