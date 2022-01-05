import { useRef, useState, Fragment, useEffect } from "react";
import React, { Component } from 'react';
import Cropper from "react-easy-crop";
import getCroppedImg, { generateDownload } from "../utils/cropImage";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon,PhotographIcon,XIcon,CameraIcon,RewindIcon } from "@heroicons/react/outline";
import { API_BASE_URL,API_GENCARD_IMG_URL } from "../constrants/apiConstrants";
import axios from "axios";
import AuthService from "../services/auth.service";
import usestateref from 'react-usestateref';
import { data } from "autoprefixer";
import {Collapse} from 'react-collapse';

export function ImageCropper(props) {
  const [post, setPost] = useState(null);
  const inputRef = useRef();

  const triggerFileSelectPopup = () => inputRef.current.click();

  const [image, setImage] = useState(null);
  const [croppedArea, setCroppedArea] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropwidth, setCropwidth] = useState(300);
  const [cropheight, setCropheight] = useState(300);
  const [allowRemoveBG, setAllowRemoveBG] = useState(false);
  const [textRemovestatus, setTextRemovestatus] = useState("Please Comfirm Upload");

  const [ChosenPhoto, setChosenPhoto] = useState(false);

  const [uploaded, setUploaded] = useState([]);
  const cancelButtonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [isUploading, setIsUpLoading] = useState(false);
  const [istakephoto, setIstakephoto] = useState(false);
  const [ischoosephoto, setIschoosephoto] = useState(false);
  const [isretake, setIsRetake] = useState(false);
  const [isretakephoto, setIsRetakePhoto] = useState(false);
  const [istriggeruploadFile, setIstriggeruploadFile] = useState(false);
  const [isshowGrid, setIsshowGrid] = useState(false);


  const [showPreviewTake, setShowPreviewTake] = useState(false);

  //const [video, setvideo] = useState(null);
  const canvasRef = useRef(null);

  const [postmapping, setPostMapping,refpostmapping] = usestateref(null);
  const [mappingList, setMappingList,refmappingList] = usestateref(null);

  const [autozoom, setAutozoom] = useState(1);


  const onCropComplete = (croppedAreaPercentage, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const layoutName = props.history.location.state?.id

  const onSelectFile = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.addEventListener("load", () => {
        setImage(reader.result);
      });
    }
  };

  const onDownload = () => {
    generateDownload(image, croppedArea);
  };

  const handleClose = (e, redirect) => {

    if (redirect === 'backdropClick') {
        return false
    }
    else if(redirect ==='closedialog'){
      return true
    }
  };

  const onUpload = async () => {

    setIsUpLoading(true);
    if(allowRemoveBG === true)
    {
      const canvas = await getCroppedImg(image, croppedArea);
      const base64Canvas = canvas.toDataURL("image/jpeg").split(";base64,")[1];
      let config = {
        headers: {
          "X-Client-Secret": "DZSolution_Secret_Client",
          "Content-Type": "application/json",
        },
      };

      var payload = JSON.stringify({
        image: base64Canvas,
        fill_color: { red: 174, green: 126, blue: 186 },
      });

      const response = await axios.post(
        "https://api.dzcardsolutions.com/api/v1/image/background/remove",
        payload,
        config
      );
      setUploaded(response.data);
      setTextRemovestatus("Remove Background Successful");
    }
    else if(allowRemoveBG === false)
    {
      const canvas = await getCroppedImg(image, croppedArea);
      const base64Canvas = await canvas.toDataURL("image/jpeg").split(";base64,")[1];

      let objImg={};
      objImg["image"]=base64Canvas;
      setUploaded(objImg);


    }
    setOpen(true);
    setIsUpLoading(false);
  };

  const getWidthHeightCropper = ()=>{
    if(postmapping.results != null)
    {
      for(var key in postmapping.results)
          {
            if(postmapping.results[key].layout_name === layoutName)
            {
              setAllowRemoveBG(postmapping.results[key].removeBG);
              setCropwidth(postmapping.results[key].crop_width);
              setCropheight(postmapping.results[key].crop_height);

              let box = document.getElementById('box');
              let width = box.offsetWidth;
              if(width <= postmapping.results[key].crop_width)
              {
                  let zoom =((width-10)/postmapping.results[key].crop_width);
                  setAutozoom(zoom);
              }
              // else if(width > postmapping.results[key].crop_width)
              // {
              //   let zoom = postmapping.results[key].crop_width;
              //   setAutozoom(zoom);
              //   console.log(zoom);
              //   console.log("width > postmapping");
              //   console.log(autozoom);
              // }
              // if(postmapping.results[key].cropImgcard === true)
              // {
              //   setCropwidth(1016);crop_width
              //   setCropheight(642);
              // }
              // else if (postmapping.results[key].cropHuman === true)
              // {
              //   setCropwidth(395);
              //   setCropheight(395);
              // }
            }
          }
    }
  }

  AuthService.getAccessToken();
  const accessToken = localStorage.getItem("accessToken");

  useEffect(async() => {
    await axios
      .get(API_BASE_URL + "/v1/mappinglist", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setPostMapping(response.data);
        setMappingList(response.data.results);
      });

    await axios
      .get(API_BASE_URL + "/v1/userlist", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setPost(response.data);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setChosenPhoto(true);
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
  }, []);

  // let payload = {
  //   image: uploaded.image,
  // };

  const onUploadToServer = async () => {
    setIsUpLoading(true);
    let serverHeader = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    let dataToUpload = `data:image/jpeg;base64,${uploaded.image}`;
    const file = dataURLtoFile(dataToUpload);
    const data = new FormData();
    data.append("photo", file, post.results[0].id + ".jpg");
    // put file into form data
    axios.patch(
      API_BASE_URL + "/v1/userlist/" + post.results[0].id + "/",
      data,
      serverHeader
    );
    await AutobuildCard();
    setIsUpLoading(false);
    setOpen(false);
    setConfirm(true);
    if(istakephoto == true)
    {
      stopCam();
    }

  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n) {
      u8arr[n - 1] = bstr.charCodeAt(n - 1);
      n -= 1; // to make eslint happy
    }
    return new File([u8arr], filename, { type: mime });
  };

  async function nextPage(){
    setIsUpLoading(true);
    await AutobuildCard();
    setIsUpLoading(false);
    props.history.push({pathname:"upload",state:{id:layoutName}});
    window.location.reload();

  }
  var tempimg;
  async function AutobuildCard() {
    let resultmap = await genResultmapping();
    if(post!=null){
      let dataToUpload = `data:image/jpeg;base64,${uploaded.image}`;
      const resultCombine =await combineDataAndImg(resultmap,dataToUpload);
      await requestCardimg(resultCombine);
      await onUploadToServer2();
    }
  }

  function genResultmapping() {
    return new Promise(resolve => {
      var dataarry={};
      if (postmapping.results != null){
        for (var layout in postmapping.results)
        {
          //if(postmapping.results[layout].layout_name === refselectmapping.current.layout_name)
          // if(postmapping.results[layout].layout_name === selectedLayout)
          if(postmapping.results[layout].layout_name === layoutName)
          {
            var keyjson= Object.keys(postmapping.results[layout].api_field_name);
            var valuejson= Object.values(postmapping.results[layout].api_field_name);

            for(var key in keyjson)
            {
              const myObj = JSON.parse(JSON.stringify(post.results[0]));
              dataarry[valuejson[key]]=myObj[keyjson[key]];
            }
            break;
          }
        }
      }
      resolve(dataarry);
    });
  }
  const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;

        resolve(base64data);
      }
    });
  }
  function combineDataAndImg(DataAr,imgsBase64) {
    return new Promise(resolve => {
      DataAr["PHOTO64_1"]=imgsBase64;
      resolve(DataAr);
    });
  }

  async function requestCardimg(dataInput) {
    // return new Promise(resolve => {
    var date = new Date();
    var dateandtime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let imgfs={};
    await axios
      .post(API_GENCARD_IMG_URL, {
        // layout_name: postmapping.results[0].layout_name,
        with_background:true,
        layout_name: layoutName,
        tag: dateandtime,
        input:[dataInput]
      })
      .then((response) => {
         tempimg = JSON.parse(JSON.stringify(response.data.output[0]));
      });
      // resolve(imgfs);
    // });
  }
  const currentUser = AuthService.getCurrentUser();

  const onUploadToServer2 = async () => {
    let serverHeader = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    console.log("tempimg");
    console.log(tempimg);
    const filef = await dataURLtoFile(tempimg['front']);
    const fileb = await dataURLtoFile(tempimg['back']);
    const data = new FormData();

    data.append("ref_id", props.match.params.org+post.results[0].id+currentUser+"_");
    data.append("layout_name", layoutName);
    data.append("img_card_front", filef,  props.match.params.org+post.results[0].id+currentUser+data + "_F.jpg");
    data.append("img_card_back", fileb,  props.match.params.org+post.results[0].id+currentUser+data + "_B.jpg");
    // put file into form data
    axios.patch(
      API_BASE_URL + "/v1/userlist/" + post.results[0].id + "/",
      data,
      serverHeader
    );

  };

  function onGetUserMediaButtonClick() {
    getMedia();
  }




  const switchCamera = async () => {
    const listOfVideoInputs = await this.getListOfVideoInputs();

    // The device has more than one camera
    if (listOfVideoInputs.length > 1) {
      if (this.player.srcObject) {
        this.player.srcObject.getVideoTracks().forEach((track) => {
          track.stop();
        });
      }

      // switch to second camera
      if (this.cameraNumber === 0) {
        this.cameraNumber = 1;
      }
      // switch to first camera
      else if (this.cameraNumber === 1) {
        this.cameraNumber = 0;
      }

      // Restart based on camera input
      this.initializeMedia();
    } else if (listOfVideoInputs.length === 1) {
      alert("The device has only one camera");
    } else {
      alert("The device does not have a camera");
    }
  };

  const getListOfVideoInputs = async () => {
    // Get the details of audio and video output of the device
    const enumerateDevices = await navigator.mediaDevices.enumerateDevices();

    //Filter video outputs (for devices with multiple cameras)
    return enumerateDevices.filter((device) => device.kind === "videoinput");
  };


  async function getMedia() {
    const constraints = { audio: false, video: { facingMode: "user" } }; // use front camera
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.onloadedmetadata = function() {
      video.play();
    };
  }

  const stopCam = () => {
    var videoEl = document.getElementById('video');
    if (videoEl != null) {
      const stream = videoEl.srcObject;
      if (stream != null) {
        const tracks = stream.getTracks();
        tracks.forEach(function(track) {
        track.stop();
        });
        videoEl.srcObject = null;
      }
    }

  }

  async function takepicture() {
    if(istriggeruploadFile === true && isretake === true)
    {
      const canvas = document.getElementById('img');
      const ctx = canvas.getContext('2d');
      const video = document.getElementById('video');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Canvas = await canvas.toDataURL("image/jpeg").split(";base64,")[1];
      let objImg={};

      objImg["image"]=base64Canvas;
      // setUploaded([]);
      // setUploaded(objImg);
      // setOpen(true);
      setImage(await canvas.toDataURL("image/jpeg"));
      stopCam();
      setIstriggeruploadFile(false);
      setIsRetakePhoto(true);
    }
    else if (istriggeruploadFile === true && isretake ===false)
    {
      await getMedia();
      setImage(null);
      setIsRetake(true);
      setIsRetakePhoto(false);
    }
    else if (istriggeruploadFile === false && isretake ===true && isretakephoto === true)
    {
      await getMedia();
      setImage(null);
      setIsRetake(true);
      setIsRetakePhoto(false);
    }
    else if(istriggeruploadFile === false && isretake ===false && isretakephoto === true)
    {
      await getMedia();
      setImage(null);
      setIsRetake(true);
      setIsRetakePhoto(false);
    }
    else
     {
     const canvas = document.getElementById('img');
     const ctx = canvas.getContext('2d');
     const video = document.getElementById('video');
     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
     const base64Canvas = await canvas.toDataURL("image/jpeg").split(";base64,")[1];
     let objImg={};

     objImg["image"]=base64Canvas;
     setImage(await canvas.toDataURL("image/jpeg"));
     stopCam();
     setIsRetakePhoto(true);

    //  setUploaded([]);
    //  setUploaded(objImg);
    //  setOpen(true);
     }
  }

  return (
    <>
      <div className="bg-gray-700 md:w-auto h-auto rounded-md relative">
        <div id="box" className="bg-black md:w-auto h-auto rounded-md relative" style={{minHeight : (cropheight + 20)+'px' , zoom : autozoom}}>
          {istakephoto &&(
            <>
            <div className="justify-center" style={{textAlign : 'center'}}>
              <video id="video" style={{display: 'inline-block'}}></video>
                <Collapse isOpened={showPreviewTake} high={"auto"}>
                  <canvas id="img"></canvas>
                </Collapse>

            </div>

            </>
          )}
           <canvas ref={canvasRef} style={{height : '0px'}} />
          {image ? (
            <>
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropSize={{width: cropwidth, height: cropheight}}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </>
          ) : null}
        </div>
        {image ? (
          <div className="flex justify-center pt-5">
            <input
              type="range"
              min="1"
              step="0.1"
              max="3"
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
            ></input>
          </div>
        ) : null}

        <div className="container-buttons flex justify-center space-x-4 pt-5">
          <input
            className="hidden"
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={onSelectFile}
          ></input>

          {istakephoto && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={takepicture}
            >
              {isretakephoto ? (
                      <div>
                        <span className="relative z-0 inline-flex shadow-sm rounded-md">
                        <CameraIcon className="h-6 w-6" aria-hidden="true" />
                        <p className="self-center">Retake</p>
                        </span>
                      </div>
                    ) : (
                      <CameraIcon className="h-6 w-6" aria-hidden="true" />
                    )}


            </button>
            )
          }
          {ischoosephoto && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                        triggerFileSelectPopup();
                        getWidthHeightCropper();
                        setIstriggeruploadFile(true);
                        setIsRetake(false);
                        stopCam();
                      }}
            >
              <PhotographIcon className="h-6 w-6" aria-hidden="true" />
            </button>

          )}

          {/* <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={nextPage}
              >
                {isUploading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : null}
                next step
              </button> */}

        </div>
        <div className="container-buttons flex justify-center space-x-4 pt-5 pb-2">
             <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  props.history.push({pathname:"Layout",state:{id:layoutName}});
                  //props.history.goBack();
                  window.location.reload();
                }}
              >
                <RewindIcon className="h-6 w-6" aria-hidden="true" />
                Back
              </button>
        {image ? (
            <>
            <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onDownload}
              >
                Download
              </button>

              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : null}
                Upload
              </button>
            </>
          ) : null}

        </div>
      </div>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          // initialFocus={cancelButtonRef}
          onClose={(event, reason) => {
            handleClose(event, reason);
        }}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckIcon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      {textRemovestatus}
                    </Dialog.Title>
                    <div className="mt-2">
                      <img
                        className="mx-auto w-auto"
                        src={`data:image/jpeg;base64,${uploaded.image}`}
                        alt="org_image"
                      />
                      <p className="text-sm pt-2 text-gray-500">
                        Do you want to upload this picture?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={onUploadToServer}
                    disabled={isUploading}
                  > {isUploading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : null}
                    Upload
                  </button>
                  <button
                    type="button"
                    disabled={isUploading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setOpen(false)}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <Transition.Root show={confirm} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setConfirm}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckIcon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Upload Successful
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Your photo will be reviewed and printed.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    onClick={() => {
                      props.history.push({pathname:"upload",state:{id:layoutName}});
                      //props.history.goBack();
                      window.location.reload();
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <Transition.Root show={ChosenPhoto} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={(event, reason) => {
            handleClose(event, reason);
        }}
        >
          <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="self-center	inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                <div>
                <button className="absolute right-5 ml-auto bg-gray-100 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-200 focus:ring-white float-right"
                onClick={() => {
                  setChosenPhoto(false);
                  props.history.push({pathname:"layout",state:{id:layoutName}});
                  window.location.reload();
                }}>
                    <span className="sr-only">View notifications</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <PhotographIcon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      STEP 2: Upload Your Photo
                    </Dialog.Title>

                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                      Either Take a Photo or Choose a Photo​.
                      </p>
                    </div>
                    <div className="container-buttons flex justify-center space-x-4 pt-5">

                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    onClick={() => {
                      setIstakephoto(true);
                      setChosenPhoto(false);
                      setIschoosephoto(true);
                      getWidthHeightCropper();
                      onGetUserMediaButtonClick();


                    }}>
                       <p className="self-center">
                       Take photo
                      </p>
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    onClick={() => {
                      setIschoosephoto(true);
                      setChosenPhoto(false);
                      triggerFileSelectPopup();
                      getWidthHeightCropper();

                    }}>
                      {/* <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <PhotographIcon
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                        />
                      </div> */}

                      <p className="self-center">
                        Choose photo
                      </p>
                  </button>
                </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
