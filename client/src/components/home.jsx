import React from 'react';

const Home = ({ isLogin , user}) => {
    return (
        <div className="container mt-5">
            <h1 className="text-center">Welcome to Punchfast</h1>
            {isLogin ? (
                <div className="alert alert-success text-center mt-4">
                    You are signed in as a {user}.
                </div>
            ) : (
                <div className="alert alert-warning text-center mt-4">
                    You are not signed in.
                </div>
            )}
        </div>
    );
};

export default Home;
