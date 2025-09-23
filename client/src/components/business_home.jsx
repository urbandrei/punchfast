import React from 'react';

const BusinessHome = ({ isLogin }) => {
    return (
        <div className="container mt-5">
            <h1 className="text-center">Welcome to Punchfast Business Portal</h1>
            {isLogin ? (
                <div className="alert alert-success text-center mt-4">
                    You are signed in.
                </div>
            ) : (
                <div className="alert alert-warning text-center mt-4">
                    You are not signed in.
                </div>
            )}
        </div>
    );
};

export default BusinessHome;
