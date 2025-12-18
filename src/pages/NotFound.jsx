import React from 'react';
import {  Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
       <h1 className="text-9xl font-extrabold tracking-widest text-primary">404</h1>
       <div className="bg-primary px-2 text-sm rounded rotate-12 absolute text-primary-foreground">
         Page Not Found
       </div>
       <p className="text-muted-foreground text-lg">
          Sorry, we couldn't find the page you're looking for.
       </p>
       <Link to="/">
          <Button>Go Home</Button>
       </Link>
    </div>
  ); 
};

export default NotFound;
