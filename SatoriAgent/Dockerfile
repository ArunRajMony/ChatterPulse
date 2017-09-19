FROM node:boron

# Create app directory
WORKDIR /usr/src/app


# Install app dependencies
COPY package.json .
# For npm@5 or later, copy package-lock.json as well
# COPY package.json package-lock.json ./

RUN npm install

# Bundle app source
COPY . .

# install pm2
RUN npm install pm2 -g

# for non-pm2 based run
#CMD [ "npm", "start" ]

# for pm2 based run
#CMD [ "pm2-docker" , "pm2_process.json" ]
CMD [ "pm2-docker" , "--env", "production"  ,"pm2_process.json" , "--web"]
