# Facenet-API

Express API to Recognize Multiple Faces

# Setup

Install NodeJS dependencies and Tensorflow

```
npm install

pip3 install tensorflow
pip3 install scipy
pip3 install scikit-image
pip3 install -U scikit-learn scipy matplotlib
pip3 install opencv-python
apt-get install -y libsm6 libxext6 libxrender-dev
```

Install and Verify MongoDB

```
sudo apt install -y mongodb
sudo systemctl status mongodb
```

# Run Locally

```
npm start
```

# Docker

Installation:
https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04

Building image and running a new container:

```
sudo docker build -t <tag> .
sudo docker run -p 3000:3000 <tag>
```

Build and run API and MongoDB containers:

```
sudo docker-compose up --build
sudo docker-compose up -d  # Detached mode
```

Additional docker commands:

```
sudo docker-compose down # Stop container
docker images # View all images
docker ps # View all runnin containers
```

To get into container's shell:

```
docker exec -it <container_id> /bin/bash
```
