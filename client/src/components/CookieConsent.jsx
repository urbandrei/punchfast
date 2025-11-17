import { useState, useEffect } from "react";

const CookieConsent = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem("cookiesAccepted");
        if (!accepted) setShow(true);
    }, []);

    if (!show) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            background: "white",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            zIndex: 9999
        }}>
            <p>This site uses cookies to keep you logged in.</p>

            <button
                className="btn btn-success me-2"
                onClick={() => {
                    localStorage.setItem("cookiesAccepted", "true");
                    setShow(false);
                }}
            >
                Accept
            </button>

            <button
                className="btn btn-danger"
                onClick={() => setShow(false)}
            >
                Reject
            </button>
        </div>
    );
};

export default CookieConsent;
