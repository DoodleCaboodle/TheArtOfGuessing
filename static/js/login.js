(function(){
    window.onload = function() {

        var userForms = document.getElementById('user_options-forms');
        
        if (annyang) {
            var commands = {
                'login': function() {
                    userForms.classList.remove('bounceLeft');
                    userForms.classList.add('bounceRight');
                },
                'sign up': function() {
                    userForms.classList.remove('bounceRight');
                    userForms.classList.add('bounceLeft');
                },
                'signup': function() {
                    userForms.classList.remove('bounceRight');
                    userForms.classList.add('bounceLeft');
                }
            };
            annyang.addCommands(commands);
            annyang.start();
        }

        function loginSubmit() {
            var email = document.getElementById("login-email").value;
            var pass = document.getElementById("login-password").value;
            loginClear();
            api.signin(email, pass, function(err, res) {
                if (err) console.log(err);
                window.location.href = "/";
            });
        }

        function signupSubmit() {
            var fullName = document.getElementById("full-name").value;
            var email = document.getElementById("signup-email").value;
            var pass = document.getElementById("signup-password").value;
            var firstName = fullName.split(" ")[0];
            var lastName = fullName.split(" ")[1];
            signupClear();
            api.signup(email, pass, firstName, lastName, function(err, res){
                if (err) console.log(err);
                window.location.href = "/";
            });
        }

        function signupClear() {
            document.getElementById("full-name").value = '';
            document.getElementById("signup-email").value = '';
            document.getElementById("signup-password").value = '';
        }
        
        function loginClear() {
            document.getElementById("login-email").value = '';
            document.getElementById("login-password").value = '';   
        }
                       
        document.getElementById("login-submit-btn").addEventListener("click", function() {
             loginSubmit();
        });

        document.getElementById("signup-submit-btn").addEventListener("click", function() {
            signupSubmit();
        });
        
        document.querySelector('form').addEventListener('submit', function(e){
            e.preventDefault();
        });

        document.getElementById('signup-button').addEventListener('click', function(){
            userForms.classList.remove('bounceRight');
            userForms.classList.add('bounceLeft');
        });

        document.getElementById('login-button').addEventListener('click', function(){
            userForms.classList.remove('bounceLeft');
            userForms.classList.add('bounceRight');
        });
    };
}());