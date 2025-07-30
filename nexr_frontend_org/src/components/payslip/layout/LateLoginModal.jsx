import React from 'react'
import { Button, Modal, SelectPicker } from 'rsuite'
import Loading from '../../Loader'
import TextEditor from '../TextEditor'

export default function LateLoginModal({ type, workTimeTracker, isLateLogin, fillLateLoginObj, isAddinglateLogin, lateLoginProof, addLateLogin, removeProof, changeLateLogin }) {
    const lateType = [
        { label: "Technical Downtime (IT/Office/System-related delay)", value: "Technical Downtime (IT/Office/System-related delay)" },
        { label: "Late Punch (Employee-side delay)", value: "Late Punch (Employee-side delay)" }
    ];
    return (
        <Modal open={isLateLogin} size="sm" backdrop="static" onClose={type === "View LateLogin" ? changeLateLogin : null}>
            <Modal.Header >
                <Modal.Title>
                    Reason for Late Punch-in
                </Modal.Title>
            </Modal.Header >

            <Modal.Body>
                <div className="modelInput">
                    <p className='modelLabel important'>Late Type</p>
                    <SelectPicker
                        required
                        data={lateType}
                        size="lg"
                        appearance='default'
                        style={{ width: "100%" }}
                        readOnly={type === "View LateLogin" ? true : false}
                        placeholder="Select Late type"
                        value={workTimeTracker?.lateLogin?.lateType}
                        onChange={(e) => fillLateLoginObj(e, "lateType")}
                    />
                </div>
                <div className="modelInput">
                    <p className='modelLabel important'>Reason for the Late</p>
                    <TextEditor
                        isDisabled={type === "View LateLogin" ? true : false}
                        handleChange={(e) => fillLateLoginObj(e?.trimStart()?.replace(/\s+/g, ' '), "lateReason")}
                        content={workTimeTracker?.lateLogin?.lateReason}
                    />
                </div>
                <div className="modelInput">
                    <p>Proof</p>
                    <input
                        type="file"
                        readOnly={type === "View LateLogin" ? true : false}
                        className="form-control"
                        onChange={(e) => type === "View LateLogin" ? null : fillLateLoginObj(e, "proof")}
                    />
                </div>
                {lateLoginProof?.map((imgFile, index) => (
                    <div className="col-lg-4 p-2" key={index}>
                        <div className="position-relative">
                            {(workTimeTracker?.lateLogin?.proof?.length === lateLoginProof?.length && workTimeTracker?.lateLogin[index]?.type === "video/mp4" || imgFile.includes(".mp4")) ?
                                <video className="w-100 h-auto" controls>
                                    <source src={imgFile} type={workTimeTracker?.lateLogin[index].type} />
                                </video> :
                                <img
                                    src={imgFile}
                                    className="w-100 h-auto"
                                    alt="uploaded file"
                                    style={{ borderRadius: "4px" }}
                                />}
                            {
                                type === "View LateLogin" ? null :
                                    <button onClick={() => removeProof(imgFile, index)} className="remBtn">
                                        &times;
                                    </button>
                            }
                        </div>
                    </div>
                ))}
            </Modal.Body>

            <Modal.Footer>
                {/* for view reason */}
                {/* for add reason */}
                {type === "View LateLogin" ?
                    <Button onClick={changeLateLogin} appearance="primary" >
                        Back
                    </Button> :
                    <Button
                        disabled={!workTimeTracker?.lateLogin?.lateReason || !workTimeTracker?.lateLogin?.lateType ? true : false}
                        onClick={addLateLogin}
                        appearance="primary"
                    >
                        {isAddinglateLogin ? <Loading color='white' size={20} /> : "Add"}
                    </Button>
                }
            </Modal.Footer>
        </Modal >
    )
}
