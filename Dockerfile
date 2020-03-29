FROM node:13.10-slim
WORKDIR /app

RUN apt-get update
RUN apt-get install -y python3
RUN apt install -y python3-pip
RUN apt-get install -y libsm6 libxext6 libxrender-dev
RUN apt-get install nano

RUN pip3 install tensorflow scipy scikit-image scikit-learn matplotlib opencv-python

COPY package*.json /app/
RUN npm install

COPY . /app

EXPOSE 3000
CMD ["npm", "start"]
