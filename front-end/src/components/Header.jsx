import { faStaylinked } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="md:px-10 px-8 py-4 backdrop-blur-2xl flex justify-between text-neutral-300 fixed w-full">
      <Link to="/" className="hover:text-neutral-50">
        <FontAwesomeIcon icon={faStaylinked} />
      </Link>

      <nav>
        <ul className="flex gap-4">
          <li>
            <Link to="/login" className="hover:text-neutral-50">
              Login{" "}
            </Link>
          </li>
          <li>
            <Link to="/Signup" className="hover:text-neutral-50">
              Signup
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
